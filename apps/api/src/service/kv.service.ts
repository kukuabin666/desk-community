import { Provide, Scope, ScopeEnum, Init, Config, Logger, ILogger } from '@midwayjs/core';
import Redis from 'ioredis';

/**
 * 简易 KV：配置了 `desk.redisUrl` 时用 Redis；否则内存 Map + TTL（开发/单机限流、短信验证码等共用）。
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class KvService {
  @Logger()
  logger: ILogger;

  @Config('desk')
  desk: { redisUrl?: string };

  private redis: Redis | null = null;
  private mem = new Map<string, { v: string; exp: number }>();

  @Init()
  async init() {
    const url = this.desk?.redisUrl;
    if (url) {
      try {
        this.redis = new Redis(url);
        this.logger.info('[KvService] Redis connected');
      } catch (e) {
        this.logger.warn('[KvService] Redis failed, using memory', e);
        this.redis = null;
      }
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redis) return this.redis.get(key);
    const row = this.mem.get(key);
    if (!row) return null;
    // 内存后端：过期即惰性删除，与 Redis TTL 语义对齐
    if (row.exp && Date.now() > row.exp) {
      this.mem.delete(key);
      return null;
    }
    return row.v;
  }

  async set(key: string, value: string, ttlSec?: number): Promise<void> {
    if (this.redis) {
      if (ttlSec) await this.redis.set(key, value, 'EX', ttlSec);
      else await this.redis.set(key, value);
      return;
    }
    // exp=0 表示无 TTL（与「永不过期」约定一致）
    this.mem.set(key, { v: value, exp: ttlSec ? Date.now() + ttlSec * 1000 : 0 });
  }

  async incr(key: string, ttlSec?: number): Promise<number> {
    if (this.redis) {
      const n = await this.redis.incr(key);
      if (ttlSec && n === 1) await this.redis.expire(key, ttlSec);
      return n;
    }
    // 内存路径：首写时设绝对过期时刻，后续 incr 沿用
    const old = this.mem.get(key);
    const cur = Number(old?.v || '0') + 1;
    let exp = old?.exp || 0;
    if (ttlSec && !old) exp = Date.now() + ttlSec * 1000;
    this.mem.set(key, { v: String(cur), exp });
    return cur;
  }

  async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.mem.delete(key);
  }
}
