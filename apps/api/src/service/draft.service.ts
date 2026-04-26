/**
 * 发布页草稿：按 userId + kind 存 JSON 字符串；有则更新无则插入。
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { DraftEntity } from '../entity/draft.entity';

@Provide()
export class DraftService {
  @InjectEntityModel(DraftEntity)
  draftRepo: Repository<DraftEntity>;

  async get(userId: number, kind: string) {
    const row = await this.draftRepo.findOne({ where: { userId, kind } });
    // DB 存 string，对外还原为对象
    return row ? JSON.parse(row.payload) : null;
  }

  async save(userId: number, kind: string, payload: unknown) {
    const body = JSON.stringify(payload ?? {});
    const existing = await this.draftRepo.findOne({ where: { userId, kind } });
    if (existing) {
      existing.payload = body;
      await this.draftRepo.save(existing);
      return { ok: true };
    }
    await this.draftRepo.save(this.draftRepo.create({ userId, kind, payload: body }));
    return { ok: true };
  }
}
