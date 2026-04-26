/**
 * 可选登录：若有合法 Bearer 则解析并设置 `ctx.user`；无 token 或非法 token 不拦截，供公开读接口区分「本人/访客」。
 */
import { Middleware, IMiddleware, Inject } from '@midwayjs/core';
import { JwtService } from '@midwayjs/jwt';
import { Context, NextFunction } from '@midwayjs/koa';

@Middleware()
export class JwtOptionalMiddleware implements IMiddleware<Context, NextFunction> {
  @Inject()
  jwtService: JwtService;

  resolve() {
    return async (ctx, next) => {
      const h = ctx.get('authorization');
      if (h?.toLowerCase().startsWith('bearer ')) {
        const token = h.slice(7).trim();
        try {
          const payload = (await this.jwtService.verify(token)) as {
            sub?: string;
            role?: string;
          };
          const id = Number(payload?.sub);
          if (id) {
            const role = payload.role === 'admin' ? 'admin' : 'user';
            ctx.user = { id, role };
          }
        } catch {
          // ignore invalid token for optional routes
        }
      }
      await next();
    };
  }
}
