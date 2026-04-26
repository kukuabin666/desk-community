/**
 * 帖子配图表（`post_images`）：一条帖子多张图，按 `sortOrder` 展示。
 *
 * - `postId` 外键指向 `PostEntity`，帖子删除时 CASCADE。
 * - `url`：一般为上传后的可访问路径（静态或 CDN）。
 * - 不包含独立时间戳；生命周期随父贴。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PostEntity } from './post.entity';

@Entity('post_images')
export class PostImageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @ManyToOne(() => PostEntity, p => p.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @Column()
  url: string;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;
}
