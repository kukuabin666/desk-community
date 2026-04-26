/**
 * 成长体系：积分规则查询、流水分页、按 action 发积分/扣积分并同步经验与等级（事务内一致性）。
 */
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { InjectDataSource } from '@midwayjs/typeorm';
import { UserEntity } from '../entity/user.entity';
import { PointsLedgerEntity } from '../entity/points-ledger.entity';
import { ExpLedgerEntity } from '../entity/exp-ledger.entity';
import { LevelConfigEntity } from '../entity/level-config.entity';
import { PointRuleEntity } from '../entity/point-rule.entity';
import { KvService } from './kv.service';

@Provide()
export class GrowthService {
  @InjectEntityModel(UserEntity)
  userRepo: Repository<UserEntity>;

  @InjectEntityModel(PointsLedgerEntity)
  pointsLedgerRepo: Repository<PointsLedgerEntity>;

  @InjectEntityModel(ExpLedgerEntity)
  expLedgerRepo: Repository<ExpLedgerEntity>;

  @InjectEntityModel(LevelConfigEntity)
  levelRepo: Repository<LevelConfigEntity>;

  @InjectEntityModel(PointRuleEntity)
  pointRuleRepo: Repository<PointRuleEntity>;

  @InjectDataSource()
  dataSource;

  @Inject()
  kv: KvService;

  async getRules() {
    const points = await this.pointRuleRepo.find({ order: { id: 'ASC' } });
    const levels = await this.levelRepo.find({ order: { level: 'ASC' } });
    return { points, levels };
  }

  async getPointsLedger(userId: number, type: 'earn' | 'spend', cursor?: number) {
    const qb = this.pointsLedgerRepo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .orderBy('l.id', 'DESC')
      .take(20);
    if (type === 'earn') qb.andWhere('l.delta > :z', { z: 0 });
    if (type === 'spend') qb.andWhere('l.delta < :z', { z: 0 });
    // 游标分页：id 递减，cursor 为上一页最后一条 id
    if (cursor) qb.andWhere('l.id < :cursor', { cursor });
    const rows = await qb.getMany();
    return rows.map(r => ({
      id: r.id,
      action: r.action,
      delta: r.delta,
      balanceAfter: r.balanceAfter,
      memo: r.memo,
      createdAt: r.createdAt,
    }));
  }

  async applyAction(userId: number, action: string, memo = '') {
    const rule = await this.pointRuleRepo.findOne({ where: { action } });
    if (!rule) return { awarded: 0, exp: 0, levelUp: null as null | number };
    const delta = rule.points;
    const expDelta = delta > 0 ? Math.max(1, Math.floor(delta)) : 0;

    // 正积分且配置了 dailyCap：按自然日 KV 计数，超限直接短路（不进事务）
    if (rule.dailyCap != null && delta > 0) {
      const key = `ptcap:${userId}:${action}:${new Date().toISOString().slice(0, 10)}`;
      const used = Number((await this.kv.get(key)) || '0');
      if (used >= rule.dailyCap) return { awarded: 0, exp: 0, levelUp: null };
      await this.kv.set(key, String(used + 1), 26 * 3600);
    }

    // 用户余额、流水、经验在同一事务内更新，避免中间态
    return this.dataSource.transaction(async mgr => {
      const uRepo = mgr.getRepository(UserEntity);
      const pRepo = mgr.getRepository(PointsLedgerEntity);
      const eRepo = mgr.getRepository(ExpLedgerEntity);
      const user = await uRepo.findOne({ where: { id: userId } });
      if (!user) throw new Error('NO_USER');
      const newPoints = user.pointsBalance + delta;
      if (newPoints < 0) throw new Error('POINTS_NOT_ENOUGH');
      const newExp = user.expTotal + expDelta;
      const oldLevel = user.level;
      // 按 min_exp 降序找最高可达等级
      const newLevel = await this.computeLevel(mgr.getRepository(LevelConfigEntity), newExp);
      await uRepo.update(
        { id: userId },
        { pointsBalance: newPoints, expTotal: newExp, level: newLevel }
      );
      await pRepo.save(
        pRepo.create({
          userId,
          action,
          delta,
          balanceAfter: newPoints,
          memo,
        })
      );
      if (expDelta > 0) {
        await eRepo.save(
          eRepo.create({
            userId,
            action,
            delta: expDelta,
            totalAfter: newExp,
          })
        );
      }
      return {
        awarded: delta,
        exp: expDelta,
        levelUp: newLevel > oldLevel ? newLevel : null,
      };
    });
  }

  private async computeLevel(repo: Repository<LevelConfigEntity>, exp: number) {
    const rows = await repo.find({ order: { level: 'DESC' } });
    for (const r of rows) {
      if (exp >= r.minExp) return r.level;
    }
    return 1;
  }
}
