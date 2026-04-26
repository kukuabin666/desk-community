/**
 * 管理员：在 `JwtAuthMiddleware` 之后挂载，要求 JWT 内 `role === 'admin'`（与签发时 DB 角色一致）。
 */
import { Middleware, IMiddleware } from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';
import { fail } from '../util/response';

@Middleware()
export class AdminAuthMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx, next) => {
      if (ctx.user?.role !== 'admin') {
        fail(ctx, 403, 403001, '需要管理员权限');
        return;
      }
      await next();
    };
  }
}
