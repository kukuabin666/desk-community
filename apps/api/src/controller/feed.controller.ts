/**
 * 首页 Feed：`GET /api/feed`（公开），游标分页 + Banner；与 Web `HomePage` 中 `useInfiniteQuery` 对应。
 */
import { Controller, Get, Inject, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PostService } from '../service/post.service';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { BannerEntity } from '../entity/banner.entity';
import { ok } from '../util/response';

@Controller('/api')
export class FeedController {
  @Inject()
  posts: PostService;

  @InjectEntityModel(BannerEntity)
  bannerRepo: Repository<BannerEntity>;

  @Get('/feed')
  async feed(ctx: Context, @Query('cursor') cursor?: string) {
    const list = await this.posts.listFeed(cursor ? Number(cursor) : undefined, 20);
    const banners = await this.bannerRepo.find({ where: { active: true }, order: { sortOrder: 'ASC' } });
    ok(ctx, { list, banners });
  }
}
