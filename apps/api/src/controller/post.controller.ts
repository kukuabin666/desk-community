/**
 * 帖子 CRUD 与互动：`/api/posts/*`。
 * - 路由注册顺序：具体路径（如 `/:id/comments`）需在动态 `/:id` 之前声明，避免被误匹配（Midway 按定义顺序匹配）。
 * - 读接口多用 `JwtOptionalMiddleware`，写操作（发帖、评论、点赞、收藏）用 `JwtAuthMiddleware`。
 */
import { Controller, Get, Post, Body, Param, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { JwtOptionalMiddleware } from '../middleware/jwt-optional.middleware';
import { PostService } from '../service/post.service';
import { InteractionService } from '../service/interaction.service';
import { ok, fail } from '../util/response';

@Controller('/api/posts')
export class PostController {
  @Inject()
  posts: PostService;

  @Inject()
  interaction: InteractionService;

  @Post('/', { middleware: [JwtAuthMiddleware] })
  async create(
    ctx: Context,
    @Body()
    body: { title?: string; content?: string; type?: 'share' | 'renovation' | 'fusion'; imageUrls: string[] }
  ) {
    try {
      const p = await this.posts.create(ctx.user!.id, {
        title: body.title || '',
        content: body.content || '',
        type: body.type || 'share',
        imageUrls: body.imageUrls || [],
      });
      ok(ctx, p);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m === 'NO_IMAGES') fail(ctx, 400, 400201, '至少上传1张图片');
      else fail(ctx, 400, 400299, m);
    }
  }

  @Get('/:id/comments', { middleware: [JwtOptionalMiddleware] })
  async comments(ctx: Context, @Param('id') id: string) {
    ok(ctx, await this.interaction.listComments(Number(id)));
  }

  @Post('/:id/comments', { middleware: [JwtAuthMiddleware] })
  async addComment(
    ctx: Context,
    @Param('id') id: string,
    @Body() body: { body: string; images?: string[]; parentId?: number }
  ) {
    const c = await this.interaction.addComment(ctx.user!.id, Number(id), body);
    ok(ctx, c);
  }

  @Post('/:id/like', { middleware: [JwtAuthMiddleware] })
  async like(ctx: Context, @Param('id') id: string) {
    ok(ctx, await this.interaction.toggleLike(ctx.user!.id, Number(id)));
  }

  @Get('/:id/folders', { middleware: [JwtAuthMiddleware] })
  async folders(ctx: Context) {
    ok(ctx, await this.interaction.listFolders(ctx.user!.id));
  }

  @Post('/:id/favorite', { middleware: [JwtAuthMiddleware] })
  async fav(ctx: Context, @Param('id') id: string, @Body() body: { folderId?: number }) {
    try {
      await this.interaction.ensureFavorite(ctx.user!.id, Number(id), body.folderId);
      ok(ctx, { ok: true });
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_FOLDER')
        fail(ctx, 400, 400202, '收藏夹不存在');
      else fail(ctx, 400, 400299, String(e));
    }
  }

  @Get('/:id', { middleware: [JwtOptionalMiddleware] })
  async one(ctx: Context, @Param('id') id: string) {
    const post = await this.posts.getById(Number(id));
    if (!post) {
      fail(ctx, 404, 404001, '帖子不存在');
      return;
    }
    void this.posts.incView(Number(id));
    const state = await this.interaction.likeState(ctx.user?.id, Number(id));
    ok(ctx, { ...post, like: state });
  }
}
