/**
 * 短信验证码：开发默认 mock（打日志并回显 code）；生产可接真实通道。
 * 频控：按手机号自然日次数 + 发送冷却；验证码 SHA256 存 KV，校验成功即删（一次性）。
 */
import { Provide, Config, Logger, ILogger } from '@midwayjs/core';
import { createHash, randomInt } from 'crypto';
import { KvService } from './kv.service';
import { Inject } from '@midwayjs/core';

@Provide()
export class SmsService {
  @Logger()
  logger: ILogger;

  @Config('desk')
  desk: { smsMock?: boolean };

  @Inject()
  kv: KvService;

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  /** Returns plain code when mock (for dev UX). */
  async sendCode(phone: string): Promise<{ mockCode?: string }> {
    const dayKey = `smsday:${phone}:${new Date().toISOString().slice(0, 10)}`;
    const dayCount = await this.kv.incr(dayKey, 26 * 3600);
    if (dayCount > 5) {
      throw new Error('SMS_DAY_LIMIT');
    }
    const cool = await this.kv.get(`smscool:${phone}`);
    if (cool) {
      throw new Error('SMS_COOLDOWN');
    }
    const code = String(randomInt(100000, 999999));
    const ttl = 300;
    // 仅存哈希，避免 KV 泄露即等同明文验证码
    await this.kv.set(`sms:${phone}`, this.hashCode(code), ttl);
    await this.kv.set(`smscool:${phone}`, '1', 60);
    if (this.desk?.smsMock !== false) {
      this.logger.info(`[SMS mock] ${phone} => ${code}`);
      return { mockCode: code };
    }
    // integrate real SMS provider here
    return {};
  }

  async verifyCode(phone: string, code: string): Promise<boolean> {
    const h = await this.kv.get(`sms:${phone}`);
    if (!h) return false;
    const ok = h === this.hashCode(code);
    if (ok) await this.kv.del(`sms:${phone}`); // 防止重放
    return ok;
  }
}
