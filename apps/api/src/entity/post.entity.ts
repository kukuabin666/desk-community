/**
 * 帖子主表（`posts`）：社区图文内容核心实体。
 *
 * - `type`：`share` | `renovation` | `fusion` 等，驱动前端模板与评论类型（见 `CommentEntity.type`）。
 * - `author`：`userId` 外键，作者删除时帖子 CASCADE 删除。
 * - `images`：一对多 `PostImageEntity`，通常 `cascade` 保存时一并写入多图 URL 与排序。
 * - `viewCount`：曝光计数，由详情/列表接口按业务规则自增。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { PostImageEntity } from './post-image.entity';

export type PostType = 'share' | 'renovation' | 'fusion';

@Entity('posts')
export class PostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  author: UserEntity;

  @Column({ type: 'varchar', length: 32, default: 'share' })
  type: PostType;

  @Column({ default: '' })
  title: string;

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @OneToMany(() => PostImageEntity, img => img.post, { cascade: true })
  images: PostImageEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
