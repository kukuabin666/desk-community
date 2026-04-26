/**
 * 刷新令牌表（`refresh_tokens`）：存长效 refresh token，与 access JWT 配对做滑动过期。
 *
 * - `token` 全局唯一，便于按令牌吊销或轮换。
 * - `deviceId`：与 `UserDeviceEntity` 或客户端设备标识对齐，支持按设备登出。
 * - `expiresAt`：过期后业务层应拒绝刷新；可配合定时任务清理僵尸行。
 * - 用户删除时 CASCADE，避免孤儿令牌。
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

@Entity('refresh_tokens')
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'device_id', default: '' })
  deviceId: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
