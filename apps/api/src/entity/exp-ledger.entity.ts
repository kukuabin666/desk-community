/**
 * 经验流水表（`exp_ledger`）：与积分流水类似，记录经验值增减及变更后总经验快照。
 *
 * - `totalAfter` 对应 `users.exp_total` 在某次操作后的值，用于审计与等级晋升计算回溯。
 * - `action` 与业务事件一一对应；只增不改。
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

@Entity('exp_ledger')
export class ExpLedgerEntity {
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

  @Column({ name: 'total_after', type: 'int' })
  totalAfter: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
