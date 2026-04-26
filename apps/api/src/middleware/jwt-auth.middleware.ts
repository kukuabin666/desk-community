/**
 * 强制登录：要求 `Authorization: Bearer <accessToken>`，JWT `sub` 为用户 id，写入 `ctx.user` 后放行。
 * 在路由上通过 `{ middleware: [JwtAuthMiddleware] }` 或 Controller 级 `middleware` 挂载。
 */
import { Middleware, IMiddleware, Inject } from '@midwayjs/core';
import { JwtService } from '@midwayjs/jwt';
import { Context, NextFunction } from '@midwayjs/koa';
import { fail } from '../util/response';

@Middleware()
export class JwtAuthMiddleware implements IMiddleware<Context, NextFunction> {
  @Inject()
  jwtService: JwtService;

  resolve() {
    return async (ctx, next) => {
      const h = ctx.get('authorization');
      if (!h?.toLowerCase().startsWith('bearer ')) {
        fail(ctx, 401, 401001, '请先登录');
        return;
      }
      const token = h.slice(7).trim();
      try {
        const payload = (await this.jwtService.verify(token)) as {
          sub?: string;
          role?: string;
        };
        const id = Number(payload?.sub);
        if (!id) {
          fail(ctx, 401, 401001, '登录状态无效');
          return;
        }
        const role = payload.role === 'admin' ? 'admin' : 'user';
        ctx.user = { id, role };
        await next();
      } catch {
        fail(ctx, 401, 401001, '登录已过期');
      }
    };
  }
}
