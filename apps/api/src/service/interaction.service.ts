/**
 * 互动：赞、收藏（夹）、评论列表与发表；部分动作给作者侧发成长积分（弱依赖，失败忽略）。
 */
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { PostLikeEntity } from '../entity/post-like.entity';
import { FavoriteEntity } from '../entity/favorite.entity';
import { FavoriteFolderEntity } from '../entity/favorite-folder.entity';
import { CommentEntity } from '../entity/comment.entity';
import { PostEntity } from '../entity/post.entity';
import { GrowthService } from './growth.service';

@Provide()
export class InteractionService {
  @InjectEntityModel(PostLikeEntity)
  likeRepo: Repository<PostLikeEntity>;

  @InjectEntityModel(FavoriteEntity)
  favRepo: Repository<FavoriteEntity>;

  @InjectEntityModel(FavoriteFolderEntity)
  folderRepo: Repository<FavoriteFolderEntity>;

  @InjectEntityModel(CommentEntity)
  commentRepo: Repository<CommentEntity>;

  @InjectEntityModel(PostEntity)
  postRepo: Repository<PostEntity>;

  @Inject()
  growth: GrowthService;

  async toggleLike(userId: number, postId: number) {
    // 已赞则取消；首赞且非自荐时给帖子作者记 post_liked 积分
    const row = await this.likeRepo.findOne({ where: { userId, postId } });
    if (row) {
      await this.likeRepo.delete({ id: row.id });
      return { liked: false };
    }
    await this.likeRepo.save(this.likeRepo.create({ userId, postId }));
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (post?.userId && post.userId !== userId) {
      try {
        await this.growth.applyAction(post.userId, 'post_liked', `from:${userId}`);
      } catch {
        // ignore
      }
    }
    return { liked: true };
  }

  async likeState(userId: number | undefined, postId: number) {
    if (!userId) return { liked: false, count: await this.likeRepo.count({ where: { postId } }) };
    const liked = !!(await this.likeRepo.findOne({ where: { userId, postId } }));
    const count = await this.likeRepo.count({ where: { postId } });
    return { liked, count };
  }

  async listFolders(userId: number) {
    return this.folderRepo.find({ where: { userId }, order: { id: 'ASC' } });
  }

  async ensureFavorite(userId: number, postId: number, folderId?: number) {
    let fid = folderId;
    // 未指定夹则用默认收藏夹
    if (!fid) {
      const def = await this.folderRepo.findOne({ where: { userId, isDefault: true } });
      fid = def?.id;
      if (!fid) throw new Error('NO_FOLDER');
    }
    const exists = await this.favRepo.findOne({ where: { userId, postId, folderId: fid } });
    if (!exists) {
      await this.favRepo.save(this.favRepo.create({ userId, postId, folderId: fid }));
      // 首次收藏成功时给作者记 post_favorited（非本人）
      const post = await this.postRepo.findOne({ where: { id: postId } });
      if (post?.userId && post.userId !== userId) {
        try {
          await this.growth.applyAction(post.userId, 'post_favorited', `from:${userId}`);
        } catch {
          // ignore
        }
      }
    }
    return { ok: true };
  }

  async listFavorites(userId: number, cursor?: number, take = 20) {
    const qb = this.favRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.post', 'p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.author', 'a')
      .leftJoinAndSelect('a.profile', 'prof')
      .where('f.user_id = :userId', { userId })
      .orderBy('f.id', 'DESC')
      .take(take);
    if (cursor) qb.andWhere('f.id < :cursor', { cursor });
    const rows = await qb.getMany();
    return rows.map(f => ({
      favoriteId: f.id,
      post: f.post
        ? {
            id: f.post.id,
            title: f.post.title,
            images: (f.post.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map(i => i.url),
            author: f.post.author
              ? {
                  id: f.post.author.id,
                  nickname: f.post.author.profile?.nickname || '',
                  avatar: f.post.author.profile?.avatar || '',
                }
              : null,
          }
        : null,
    }));
  }

  async listLikedPosts(userId: number, cursor?: number, take = 20) {
    const qb = this.likeRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.post', 'p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.author', 'a')
      .leftJoinAndSelect('a.profile', 'prof')
      .where('l.user_id = :userId', { userId })
      .orderBy('l.id', 'DESC')
      .take(take);
    if (cursor) qb.andWhere('l.id < :cursor', { cursor });
    const rows = await qb.getMany();
    return rows.map(l => ({
      likeId: l.id,
      post: l.post
        ? {
            id: l.post.id,
            title: l.post.title,
            images: (l.post.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map(i => i.url),
            author: l.post.author
              ? {
                  id: l.post.author.id,
                  nickname: l.post.author.profile?.nickname || '',
                  avatar: l.post.author.profile?.avatar || '',
                }
              : null,
          }
        : null,
    }));
  }

  async listComments(postId: number) {
    const rows = await this.commentRepo.find({
      where: { postId },
      relations: ['author', 'author.profile'],
      order: { id: 'DESC' },
      take: 100,
    });
    return rows.map(c => ({
      id: c.id,
      parentId: c.parentId,
      body: c.body,
      images: c.images,
      type: c.type,
      fusionImageUrl: c.fusionImageUrl,
      likeCount: c.likeCount,
      createdAt: c.createdAt,
      author: c.author
        ? {
            id: c.author.id,
            nickname: c.author.profile?.nickname || '',
            avatar: c.author.profile?.avatar || '',
            level: c.author.level,
          }
        : null,
    }));
  }

  async addComment(
    userId: number,
    postId: number,
    body: { body: string; images?: string[]; parentId?: number | null }
  ) {
    const c = await this.commentRepo.save(
      this.commentRepo.create({
        postId,
        userId,
        body: body.body || '',
        images: body.images || [],
        parentId: body.parentId ?? null,
        type: 'normal',
      })
    );
    try {
      await this.growth.applyAction(userId, 'comment_create', `post:${postId}`);
    } catch {
      // 评论已落库，积分失败不回滚评论
    }
    return c;
  }
}
