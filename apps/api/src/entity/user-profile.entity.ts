/**
 * 用户资料扩展表（`user_profiles`）：与 `users` 一对一，存放展示与隐私相关字段。
 *
 * - `userId` 唯一，外键指向 `UserEntity`，用户删除时 CASCADE。
 * - 展示：`nickname`、`avatar`、`bio`、`interestTags`、`birthday`、`region`。
 * - 前端布局：`layoutMode`（如 single/double）影响 feed / 个人卡片排版。
 * - 隐私：`followersPublic`、`followingPublic` 控制粉丝/关注列表是否对访客可见。
 * - 运营约束：`nicknameChangedAt` 可用于限制昵称修改频率（业务层实现）。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('user_profiles')
export class UserProfileEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @OneToOne(() => UserEntity, u => u.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ default: '' })
  nickname: string;

  @Column({ default: '' })
  avatar: string;

  @Column({ default: 'secret' })
  gender: string;

  @Column({ type: 'text', default: '' })
  bio: string;

  @Column({ name: 'interest_tags', type: 'simple-json', default: '[]' })
  interestTags: string[];

  @Column({ name: 'birthday', type: 'text', nullable: true })
  birthday: string | null;

  @Column({ default: '' })
  region: string;

  /** single | double — feed & profile card layout */
  @Column({ name: 'layout_mode', default: 'double' })
  layoutMode: string;

  @Column({ name: 'followers_public', default: true })
  followersPublic: boolean;

  @Column({ name: 'following_public', default: true })
  followingPublic: boolean;

  @Column({ name: 'nickname_changed_at', type: 'datetime', nullable: true })
  nicknameChangedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
