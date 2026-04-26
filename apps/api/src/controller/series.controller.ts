/**
 * 系列与帖子编排：`/api/series/*`、`/api/me/series/*`；创建/改序/删帖等需登录（路由级 `JwtAuthMiddleware`）。
 */
import { Controller, Get, Post, Body, Param, Inject, Put } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { SeriesService } from '../service/series.service';
import { PostService } from '../service/post.service';
import { ok, fail } from '../util/response';

@Controller('/api')
export class SeriesController {
  @Inject()
  series: SeriesService;

  @Inject()
  posts: PostService;

  @Get('/users/:userId/series')
  async listUser(ctx: Context, @Param('userId') userId: string) {
    ok(ctx, await this.series.listMine(Number(userId)));
  }

  @Get('/series/:id')
  async detail(ctx: Context, @Param('id') id: string) {
    const d = await this.series.detail(Number(id));
    if (!d?.series) {
      fail(ctx, 404, 404001, '系列不存在');
      return;
    }
    const posts = (d.posts || []).map(p => this.posts.formatPost(p));
    ok(ctx, { series: d.series, posts });
  }

  @Post('/me/series', { middleware: [JwtAuthMiddleware] })
  async create(ctx: Context, @Body() body: { name: string; description?: string; coverUrl?: string }) {
    try {
      const s = await this.series.create(ctx.user!.id, body);
      ok(ctx, s);
    } catch (e) {
      fail(ctx, 400, 400301, e instanceof Error ? e.message : String(e));
    }
  }

  @Put('/me/series/:id', { middleware: [JwtAuthMiddleware] })
  async update(
    ctx: Context,
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; description: string; coverUrl: string }>
  ) {
    try {
      ok(ctx, await this.series.update(ctx.user!.id, Number(id), body));
    } catch {
      fail(ctx, 404, 404001, '系列不存在');
    }
  }

  @Post('/me/series/:id/remove', { middleware: [JwtAuthMiddleware] })
  async remove(ctx: Context, @Param('id') id: string) {
    await this.series.remove(ctx.user!.id, Number(id));
    ok(ctx, { ok: true });
  }

  @Post('/me/series/:id/posts', { middleware: [JwtAuthMiddleware] })
  async addPost(ctx: Context, @Param('id') id: string, @Body() body: { postId: number }) {
    try {
      ok(ctx, await this.series.addPost(ctx.user!.id, Number(id), body.postId));
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m === 'ALREADY_IN') fail(ctx, 409, 409301, '该帖子已在系列中');
      else fail(ctx, 400, 400302, m);
    }
  }

  @Post('/me/series/:id/posts/:postId/remove', { middleware: [JwtAuthMiddleware] })
  async rmPost(ctx: Context, @Param('id') id: string, @Param('postId') postId: string) {
    await this.series.removePost(ctx.user!.id, Number(id), Number(postId));
    ok(ctx, { ok: true });
  }

  @Post('/me/series/reorder', { middleware: [JwtAuthMiddleware] })
  async reorder(ctx: Context, @Body() body: { ids: number[] }) {
    await this.series.reorder(ctx.user!.id, body.ids || []);
    ok(ctx, { ok: true });
  }
}
