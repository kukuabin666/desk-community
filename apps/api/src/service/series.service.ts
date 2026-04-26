/**
 * 合集：增删改、排序、详情、向合集添加/移除帖子（可选用首图补封面）。
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { SeriesEntity } from '../entity/series.entity';
import { SeriesPostEntity } from '../entity/series-post.entity';
import { PostEntity } from '../entity/post.entity';

@Provide()
export class SeriesService {
  @InjectEntityModel(SeriesEntity)
  seriesRepo: Repository<SeriesEntity>;

  @InjectEntityModel(SeriesPostEntity)
  spRepo: Repository<SeriesPostEntity>;

  @InjectEntityModel(PostEntity)
  postRepo: Repository<PostEntity>;

  async listMine(userId: number) {
    const list = await this.seriesRepo.find({
      where: { userId },
      order: { sortIndex: 'ASC', id: 'DESC' },
    });
    const out: {
      id: number;
      name: string;
      description: string;
      coverUrl: string;
      viewCount: number;
      postCount: number;
      sortIndex: number;
    }[] = [];
    for (const s of list) {
      const cnt = await this.spRepo.count({ where: { seriesId: s.id } });
      out.push({
        id: s.id,
        name: s.name,
        description: s.description,
        coverUrl: s.coverUrl,
        viewCount: s.viewCount,
        postCount: cnt,
        sortIndex: s.sortIndex,
      });
    }
    return out;
  }

  async create(userId: number, body: { name: string; description?: string; coverUrl?: string }) {
    if (!body.name || body.name.length < 2 || body.name.length > 20) throw new Error('BAD_NAME');
    // 新合集 sortIndex = 当前用户 max + 1，保证列表排序稳定
    const raw = await this.seriesRepo
      .createQueryBuilder('s')
      .select('MAX(s.sort_index)', 'm')
      .where('s.user_id = :uid', { uid: userId })
      .getRawOne();
    const sortIndex = Number(raw?.m ?? 0) + 1;
    const s = await this.seriesRepo.save(
      this.seriesRepo.create({
        userId,
        name: body.name,
        description: body.description || '',
        coverUrl: body.coverUrl || '',
        sortIndex,
      })
    );
    return s;
  }

  async update(
    userId: number,
    seriesId: number,
    body: Partial<{ name: string; description: string; coverUrl: string }>
  ) {
    const s = await this.seriesRepo.findOne({ where: { id: seriesId, userId } });
    if (!s) throw new Error('NOT_FOUND');
    Object.assign(s, body);
    await this.seriesRepo.save(s);
    return s;
  }

  async remove(userId: number, seriesId: number) {
    await this.seriesRepo.delete({ id: seriesId, userId });
  }

  async detail(seriesId: number) {
    const s = await this.seriesRepo.findOne({ where: { id: seriesId } });
    if (!s) return null;
    const links = await this.spRepo.find({
      where: { seriesId },
      order: { joinedAt: 'DESC' },
      relations: ['post', 'post.images', 'post.author', 'post.author.profile'],
    });
    const posts = links.map(l => l.post).filter(Boolean);
    return { series: s, posts };
  }

  async addPost(userId: number, seriesId: number, postId: number) {
    const s = await this.seriesRepo.findOne({ where: { id: seriesId, userId } });
    if (!s) throw new Error('NOT_FOUND');
    const post = await this.postRepo.findOne({ where: { id: postId, userId } });
    if (!post) throw new Error('BAD_POST');
    const exists = await this.spRepo.findOne({ where: { seriesId, postId } });
    if (exists) throw new Error('ALREADY_IN');
    await this.spRepo.save(this.spRepo.create({ seriesId, postId }));
    // 合集尚无封面时，用首帖第一张图兜底
    if (!s.coverUrl) {
      const imgs = await this.postRepo.findOne({
        where: { id: postId },
        relations: ['images'],
      });
      const url = imgs?.images?.[0]?.url;
      if (url) await this.seriesRepo.update({ id: seriesId }, { coverUrl: url });
    }
    return { ok: true };
  }

  async removePost(userId: number, seriesId: number, postId: number) {
    const s = await this.seriesRepo.findOne({ where: { id: seriesId, userId } });
    if (!s) throw new Error('NOT_FOUND');
    await this.spRepo.delete({ seriesId, postId });
    return { ok: true };
  }

  /** 前端拖拽后的 id 顺序即新 sortIndex（从 0 递增） */
  async reorder(userId: number, ids: number[]) {
    let i = 0;
    for (const id of ids) {
      await this.seriesRepo.update({ id, userId }, { sortIndex: i++ });
    }
    return { ok: true };
  }
}
