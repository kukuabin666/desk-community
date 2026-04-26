/**
 * 与 Web 端 `ApiResp<T>` 对齐的统一 JSON：`{ success, code, message, data? }`。
 * - `ok`：成功时 `code: 0`，HTTP 状态保持默认 200。
 * - `fail`：显式设置 `ctx.status` 与业务 `code`，供前端 Toast / ErrorBlock 展示。
 */
import { Context } from '@midwayjs/koa';

export function ok<T>(ctx: Context, data?: T, message = 'ok') {
  ctx.body = { success: true, code: 0, message, data };
}

export function fail(
  ctx: Context,
  status: number,
  code: number,
  message: string,
  extra?: Record<string, unknown>
) {
  ctx.status = status;
  ctx.body = { success: false, code, message, ...extra };
}
