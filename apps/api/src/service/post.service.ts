/**
 * 帖子：创建（图集 + 可选成长积分）、详情、Feed / 个人列表、浏览量自增。
 */
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity, PostType } from '../entity/post.entity';
import { PostImageEntity } from '../entity/post-image.entity';
import { UserProfileEntity } from '../entity/user-profile.entity';
import { GrowthService } from './growth.service';

@Provide()
export class PostService {
  @InjectEntityModel(PostEntity)
  postRepo: Repository<PostEntity>;

  @InjectEntityModel(PostImageEntity)
  imageRepo: Repository<PostImageEntity>;

  @InjectEntityModel(UserProfileEntity)
  profileRepo: Repository<UserProfileEntity>;

  @Inject()
  growth: GrowthService;

  async create(
    userId: number,
    input: { title: string; content: string; type: PostType; imageUrls: string[] }
  ) {
    if (!input.imageUrls?.length) throw new Error('NO_IMAGES');
    // 主贴与图片分表；sortOrder 与上传顺序一致
    const post = await this.postRepo.save(
      this.postRepo.create({
        userId,
        title: input.title || '',
        content: input.content || '',
        type: input.type || 'share',
      })
    );
    let order = 0;
    for (const url of input.imageUrls) {
      await this.imageRepo.save(
        this.imageRepo.create({ postId: post.id, url, sortOrder: order++ })
      );
    }
    try {
      // 积分失败不阻发布（幂等/规则缺失等由 Growth 吞或抛，此处弱依赖）
      await this.growth.applyAction(userId, 'post_create', `post:${post.id}`);
    } catch {
      // ignore growth errors for post success
    }
    return this.getById(post.id);
  }

  async getById(id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['images', 'author', 'author.profile'],
    });
    if (!post) return null;
    return this.mapPost(post);
  }

  async incView(id: number) {
    await this.postRepo.increment({ id }, 'viewCount', 1);
  }

  async listFeed(cursor?: number, take = 20) {
    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.author', 'a')
      .leftJoinAndSelect('a.profile', 'prof')
      .orderBy('p.id', 'DESC')
      .take(take);
    if (cursor) qb.where('p.id < :cursor', { cursor }); // 游标：id 递减翻页，取比 cursor 更旧的一批
    const rows = await qb.getMany();
    return rows.map(p => this.mapPost(p));
  }

  async listByUser(userId: number, cursor?: number, take = 20) {
    const qb = this.postRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.images', 'img')
      .leftJoinAndSelect('p.author', 'a')
      .leftJoinAndSelect('a.profile', 'prof')
      .where('p.user_id = :userId', { userId })
      .orderBy('p.id', 'DESC')
      .take(take);
    if (cursor) qb.andWhere('p.id < :cursor', { cursor });
    const rows = await qb.getMany();
    return rows.map(p => this.mapPost(p)); // 同 mapPost，保证列表与详情字段一致
  }

  formatPost(post: PostEntity) {
    return this.mapPost(post);
  }

  /** 拼前端 DTO：图片按 sortOrder，作者嵌 profile */
  private mapPost(post: PostEntity) {
    const imgs = [...(post.images || [])].sort((a, b) => a.sortOrder - b.sortOrder);
    const prof = post.author?.profile;
    return {
      id: post.id,
      userId: post.userId,
      type: post.type,
      title: post.title,
      content: post.content,
      viewCount: post.viewCount,
      createdAt: post.createdAt,
      images: imgs.map(i => i.url),
      author: post.author
        ? {
            id: post.author.id,
            nickname: prof?.nickname || '',
            avatar: prof?.avatar || '',
            level: post.author.level,
          }
        : null,
    };
  }
}
