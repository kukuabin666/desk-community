/**
 * 用户主表（`users`）：账号凭证、安全状态与积分等级快照。
 *
 * - 登录标识：`username` / `phone` 二选一或并存，与 `passwordHash` 配合密码登录。
 * - 安全：`failedLoginAttempts`、`lockedUntil` 用于登录失败锁定策略。
 * - 业务状态：`onboardingDone`、`phoneVerified` 控制引导与手机号校验流程。
 * - 经济字段：`pointsBalance` 为当前可用积分；`expTotal` 为累计经验；`level` 为当前等级（可与 `LevelConfigEntity` 对照）。
 * - `role`：`user` | `admin`，用于管理端鉴权；JWT 内嵌 `role` 声明，刷新时从库重签。
 * - 关联：`profile` 一对一 `UserProfileEntity`（级联创建），用户删除时子表按外键策略清理。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  username: string | null;

  @Column({ type: 'varchar', length: 32, unique: true, nullable: true })
  phone: string | null;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'locked_until', type: 'datetime', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'onboarding_done', default: false })
  onboardingDone: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'points_balance', type: 'int', default: 0 })
  pointsBalance: number;

  @Column({ name: 'exp_total', type: 'int', default: 0 })
  expTotal: number;

  @Column({ name: 'level', type: 'int', default: 1 })
  level: number;

  /** `admin` 可访问 `/api/admin/*`；默认 `user` */
  @Column({ type: 'varchar', length: 16, default: 'user' })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => UserProfileEntity, profile => profile.user, { cascade: true })
  profile: UserProfileEntity;
}
