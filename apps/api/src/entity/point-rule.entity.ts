/**
 * 积分规则表（`point_rules`）：按 `action` 定义单次行为基础积分与每日上限。
 *
 * - `action` 唯一：与发积分代码中的事件名一致（如 `daily_sign`、`publish_post`）。
 * - `points`：单次基础奖励；`dailyCap` 为 null 表示不限制当日次数/上限（具体以业务实现为准）。
 * - 与 `PointsLedgerEntity` 配合：发积分前读规则，写入流水时带 `action`。
 */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('point_rules')
export class PointRuleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 64 })
  action: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ name: 'daily_cap', type: 'int', nullable: true })
  dailyCap: number | null;
}
