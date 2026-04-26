/**
 * 积分流水表（`points_ledger`）：每次积分变动追加一行，用于对账与明细列表。
 *
 * - `action`：与 `PointRuleEntity.action` 或业务常量对齐（如发帖奖励、签到、管理员调整）。
 * - `delta`：本次变动有符号整数；`balanceAfter`：变动后 `users.points_balance` 快照，便于历史回放与排查。
 * - `memo`：人类可读说明或 JSON 字符串化上下文。
 * - 只增不改；用户删除时 CASCADE。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('points_ledger')
export class PointsLedgerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ length: 64 })
  action: string;

  @Column({ type: 'int' })
  delta: number;

  @Column({ name: 'balance_after', type: 'int' })
  balanceAfter: number;

  @Column({ type: 'text', default: '' })
  memo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
