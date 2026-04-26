/**
 * 评论表（`comments`）：帖子下的树形或扁平评论（由 `parentId` 表达回复链）。
 *
 * - `parentId` 为空表示顶层评论；非空表示回复某条评论（具体层级限制由业务层处理）。
 * - `type`：`normal` | `renovation` 等与帖子类型或业务场景对齐；`fusionImageUrl` 可用于晒图类评论。
 * - `images`：`simple-json` 存 URL 数组；`likeCount` 为冗余计数或可由独立点赞表维护（当前项目以字段为例）。
 * - 帖子/作者删除时 CASCADE。
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
import { PostEntity } from './post.entity';

export type CommentType = 'normal' | 'renovation';

@Entity('comments')
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  author: UserEntity;

  @Column({ name: 'parent_id', type: 'int', nullable: true })
  parentId: number | null;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'simple-json', default: '[]' })
  images: string[];

  @Column({ type: 'varchar', length: 32, default: 'normal' })
  type: CommentType;

  @Column({ name: 'fusion_image_url', default: '' })
  fusionImageUrl: string;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
