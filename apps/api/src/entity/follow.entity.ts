/**
 * 关注关系表（`follows`）：有向边 `follower` → `following`。
 *
 * - `@Unique(['followerId', 'followingId'])`：防止重复关注；业务层应禁止自己关注自己。
 * - 任一方用户删除时 CASCADE，关系行自动消失。
 * - `createdAt`：关注时间，用于粉丝列表排序与「新关注」提示。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class FollowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'follower_id' })
  followerId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: UserEntity;

  @Column({ name: 'following_id' })
  followingId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: UserEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
