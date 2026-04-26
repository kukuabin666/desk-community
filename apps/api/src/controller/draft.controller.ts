/**
 * 发布页草稿：`/api/me/drafts/*`，Controller 级挂载 `JwtAuthMiddleware`，所有子路径均需登录。
 * `kind` 为 URL 编码的业务键（如 `publish_share`），与 Web `PublishPage` 的 `kind` 一致。
 */
import { Controller, Get, Post, Body, Param, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { DraftService } from '../service/draft.service';
import { ok } from '../util/response';

@Controller('/api/me/drafts', { middleware: [JwtAuthMiddleware] })
export class DraftController {
  @Inject()
  drafts: DraftService;

  @Get('/:kind')
  async get(ctx: Context, @Param('kind') kind: string) {
    ok(ctx, await this.drafts.get(ctx.user!.id, decodeURIComponent(kind)));
  }

  @Post('/:kind')
  async save(ctx: Context, @Param('kind') kind: string, @Body() body: unknown) {
    ok(ctx, await this.drafts.save(ctx.user!.id, decodeURIComponent(kind), body));
  }
}
