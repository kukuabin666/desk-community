/**
 * 启动种子数据：在 `configuration.onReady` 中调用；若表为空则写入等级、积分规则、Banner、示例商品等，保证新库可跑通业务。
 * 默认内容见 `../constants/seed-defaults.ts`。
 */
import { Provide, Scope, ScopeEnum, Logger, ILogger } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import {
  SEED_HOME_BANNER,
  SEED_LEVEL_ROWS,
  SEED_POINT_RULE_ROWS,
  SEED_SAMPLE_PRODUCTS,
} from '../constants/seed-defaults';
import { LevelConfigEntity } from '../entity/level-config.entity';
import { PointRuleEntity } from '../entity/point-rule.entity';
import { BannerEntity } from '../entity/banner.entity';
import { ProductEntity } from '../entity/product.entity';
import { UserEntity } from '../entity/user.entity';

@Provide()
@Scope(ScopeEnum.Singleton)
export class SeedService {
  @Logger()
  logger: ILogger;

  @InjectEntityModel(LevelConfigEntity)
  levelRepo: Repository<LevelConfigEntity>;

  @InjectEntityModel(PointRuleEntity)
  pointRuleRepo: Repository<PointRuleEntity>;

  @InjectEntityModel(BannerEntity)
  bannerRepo: Repository<BannerEntity>;

  @InjectEntityModel(ProductEntity)
  productRepo: Repository<ProductEntity>;

  @InjectEntityModel(UserEntity)
  userRepo: Repository<UserEntity>;

  async seed() {
    // 各表仅「完全空」时插入，避免覆盖运营数据
    const n = await this.levelRepo.count();
    if (n === 0) {
      await this.levelRepo.save(SEED_LEVEL_ROWS.map(l => this.levelRepo.create(l)));
      this.logger.info('[Seed] level_config inserted');
    }
    const pr = await this.pointRuleRepo.count();
    if (pr === 0) {
      await this.pointRuleRepo.save(
        SEED_POINT_RULE_ROWS.map(r => this.pointRuleRepo.create(r))
      );
      this.logger.info('[Seed] point_rules inserted');
    }
    const b = await this.bannerRepo.count();
    if (b === 0) {
      await this.bannerRepo.save(this.bannerRepo.create({ ...SEED_HOME_BANNER }));
    }
    const p = await this.productRepo.count();
    if (p === 0) {
      await this.productRepo.save(
        SEED_SAMPLE_PRODUCTS.map(row => this.productRepo.create(row))
      );
    }
    // 可选：将已存在用户的 role 升为 admin（与 H5 共用账号，需重新登录以刷新 JWT 内 role）
    const adminName = process.env.DESK_ADMIN_USERNAME?.trim();
    if (adminName) {
      const r = await this.userRepo.update({ username: adminName }, { role: 'admin' });
      if (r.affected) this.logger.info(`[Seed] admin role -> user "${adminName}"`);
      else this.logger.warn(`[Seed] DESK_ADMIN_USERNAME="${adminName}" 无匹配用户，跳过提权`);
    }
  }
}
