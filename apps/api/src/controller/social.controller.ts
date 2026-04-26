/**
 * 社交：关注/粉丝列表、用户帖子、收藏与赞列表等；读多用 `JwtOptionalMiddleware`，关注操作用 `JwtAuthMiddleware`。
 */
import { Controller, Get, Post, Param, Inject, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { JwtOptionalMiddleware } from '../middleware/jwt-optional.middleware';
import { SocialService } from '../service/social.service';
import { PostService } from '../service/post.service';
import { InteractionService } from '../service/interaction.service';
import { ok, fail } from '../util/response';

@Controller('/api')
export class SocialController {
  @Inject()
  social: SocialService;

  @Inject()
  posts: PostService;

  @Inject()
  interaction: InteractionService;

  @Get('/users/:id/stats', { middleware: [JwtOptionalMiddleware] })
  async stats(ctx: Context, @Param('id') id: string) {
    ok(ctx, await this.social.counts(Number(id)));
  }

  @Get('/users/:id/posts', { middleware: [JwtOptionalMiddleware] })
  async userPosts(ctx: Context, @Param('id') id: string, @Query('cursor') cursor?: string) {
    ok(
      ctx,
      await this.posts.listByUser(Number(id), cursor ? Number(cursor) : undefined, 20)
    );
  }

  @Post('/users/:id/follow', { middleware: [JwtAuthMiddleware] })
  async follow(ctx: Context, @Param('id') id: string) {
    try {
      await this.social.follow(ctx.user!.id, Number(id));
      ok(ctx, { ok: true });
    } catch (e) {
      if (e instanceof Error && e.message === 'SELF') fail(ctx, 400, 400401, '不能关注自己');
      else fail(ctx, 400, 400499, String(e));
    }
  }

  @Post('/users/:id/unfollow', { middleware: [JwtAuthMiddleware] })
  async unfollow(ctx: Context, @Param('id') id: string) {
    await this.social.unfollow(ctx.user!.id, Number(id));
    ok(ctx, { ok: true });
  }

  @Get('/users/:id/followers', { middleware: [JwtOptionalMiddleware] })
  async followers(ctx: Context, @Param('id') id: string) {
    ok(ctx, await this.social.listFollowers(Number(id), ctx.user?.id));
  }

  @Get('/users/:id/following', { middleware: [JwtOptionalMiddleware] })
  async following(ctx: Context, @Param('id') id: string) {
    ok(ctx, await this.social.listFollowing(Number(id), ctx.user?.id));
  }

  @Get('/me/favorites', { middleware: [JwtAuthMiddleware] })
  async favs(ctx: Context, @Query('cursor') cursor?: string) {
    ok(
      ctx,
      await this.interaction.listFavorites(ctx.user!.id, cursor ? Number(cursor) : undefined)
    );
  }

  @Get('/me/likes', { middleware: [JwtAuthMiddleware] })
  async likes(ctx: Context, @Query('cursor') cursor?: string) {
    ok(
      ctx,
      await this.interaction.listLikedPosts(ctx.user!.id, cursor ? Number(cursor) : undefined)
    );
  }
}
