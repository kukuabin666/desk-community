/**
 * 用户设备指纹表（`user_devices`）：同一用户下 `deviceId` 唯一，用于多端会话与安全审计。
 *
 * - 用途：刷新令牌轮换、设备列表展示、风控（IP/地域变更提示）等。
 * - `firstSeenAt` / `lastSeenAt`：首次与最近一次活跃时间；`lastIp`、`lastLocation` 为最近一次请求侧写入的摘要信息。
 * - 约束：`@Unique(['userId', 'deviceId'])` 避免同一设备重复建档。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_devices')
@Unique(['userId', 'deviceId'])
export class UserDeviceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'device_id' })
  deviceId: string;

  @Column({ name: 'device_label', default: '' })
  deviceLabel: string;

  @Column({ name: 'last_ip', default: '' })
  lastIp: string;

  @Column({ name: 'last_location', default: '' })
  lastLocation: string;

  @CreateDateColumn({ name: 'first_seen_at' })
  firstSeenAt: Date;

  @UpdateDateColumn({ name: 'last_seen_at' })
  lastSeenAt: Date;
}
