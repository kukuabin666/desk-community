/**
 * 等级配置表（`level_config`）：全站等级阶梯，通常由种子数据初始化、运营少改。
 *
 * - `level` 唯一：从 1 递增；`minExp` 为该等级所需最低累计经验（闭区间下界语义由业务读取方式定义）。
 * - `name`：展示用等级名称（如「Lv.3 进阶创作者」）。
 * - 与用户表 `UserEntity.level` / `expTotal` 配合：升级时查表确定当前档位。
 */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('level_config')
export class LevelConfigEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  level: number;

  @Column()
  name: string;

  @Column({ name: 'min_exp', type: 'int' })
  minExp: number;
}
