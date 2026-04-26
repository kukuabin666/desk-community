/**
 * 搜索：`GET /api/search`（帖子标题、用户昵称等简单检索）。
 */
import { Controller, Get, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from '../entity/post.entity';
import { UserProfileEntity } from '../entity/user-profile.entity';
import { ok } from '../util/response';

@Controller('/api')
export class SearchController {
  @InjectEntityModel(PostEntity)
  postRepo: Repository<PostEntity>;

  @InjectEntityModel(UserProfileEntity)
  profileRepo: Repository<UserProfileEntity>;

  @Get('/search')
  async search(ctx: Context, @Query('q') q = '') {
    const term = `%${(q || '').trim().slice(0, 64)}%`;
    if (!q.trim()) {
      ok(ctx, { posts: [], users: [] });
      return;
    }
    const posts = await this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.author', 'a')
      .leftJoinAndSelect('a.profile', 'prof')
      .where('p.title LIKE :t OR p.content LIKE :t', { t: term })
      .orderBy('p.id', 'DESC')
      .take(20)
      .getMany();
    const users = await this.profileRepo
      .createQueryBuilder('p')
      .where('p.nickname LIKE :t', { t: term })
      .take(20)
      .getMany();
    ok(ctx, {
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        images: (p.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map(i => i.url),
        author: p.author
          ? {
              id: p.author.id,
              nickname: p.author.profile?.nickname || '',
            }
          : null,
      })),
      users: users.map(p => ({
        id: p.userId,
        nickname: p.nickname,
        avatar: p.avatar,
      })),
    });
  }
}
