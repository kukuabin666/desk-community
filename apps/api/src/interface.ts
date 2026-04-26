/**
 * Koa Context 类型扩展：JWT 中间件校验通过后写入 `ctx.user`（至少含 `id`），供后续 Controller / Service 使用。
 */
import '@midwayjs/core';

declare module '@midwayjs/core' {
  interface Context {
    user?: { id: number; role?: string; username?: string | null; phone?: string | null };
  }
}
