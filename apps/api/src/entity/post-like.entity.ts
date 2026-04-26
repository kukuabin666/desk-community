/**
 * 帖子点赞表（`post_likes`）：用户对帖子的赞，一行表示一次有效点赞。
 *
 * - `@Unique(['userId', 'postId'])`：同一用户对同一帖最多一条，取消赞可删除该行。
 * - 帖子/用户删除时 CASCADE；帖子维度点赞数可由行数或冗余字段在业务层维护。
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
import { PostEntity } from './post.entity';

@Entity('post_likes')
@Unique(['userId', 'postId'])
export class PostLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'post_id' })
  postId: number;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
