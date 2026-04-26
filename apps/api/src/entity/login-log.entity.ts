/**
 * 登录流水表（`login_logs`）：每次成功或关键登录事件追加一行，只增不改。
 *
 * - 与 `UserEntity` 多对一，用户删除时 CASCADE 清理历史。
 * - 字段：`ip`、`userAgent` 还原客户端环境；`deviceLabel`、`location` 为可读摘要（非精确地理库也可存文案）。
 * - 典型查询：按 `userId` + `createdAt` 分页查看「最近登录地点/设备」。
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

@Entity('login_logs')
export class LoginLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'ip', default: '' })
  ip: string;

  @Column({ name: 'user_agent', type: 'text', default: '' })
  userAgent: string;

  @Column({ name: 'device_label', default: '' })
  deviceLabel: string;

  @Column({ name: 'location', default: '' })
  location: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
