import { Middleware, IMiddleware, Inject } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { KvService } from '../service/kv.service';
import { fail } from '../util/response';

/**
 * 登录防刷：按 IP 在 KvService 中计数（窗口与阈值见实现），超限返回 429。
 * 仅挂在需要防护的接口（如 `POST /api/auth/login`），避免全局误伤。
 */
@Middleware()
export class LoginRateLimitMiddleware implements IMiddleware<Context, NextFunction> {
  @Inject()
  kv: KvService;

  resolve() {
    return async (ctx, next) => {
      const ip = ctx.ip || 'unknown';
      const key = `loginrl:${ip}`;
      const n = await this.kv.incr(key, 120);
      if (n > 60) {
        fail(ctx, 429, 429010, '请求过于频繁，请稍后再试');
        return;
      }
      await next();
    };
  }
}
