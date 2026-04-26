/**
 * 合集-帖子关联表（`series_posts`）：多对多拆行，记录帖子加入合集的时间。
 *
 * - `@Unique(['seriesId', 'postId'])`：同一帖子在同一合集中只能出现一次。
 * - 任一侧实体删除时 CASCADE，保持引用完整性。
 * - `joinedAt`：可用于合集内「目录」按加入时间排序。
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
import { SeriesEntity } from './series.entity';
import { PostEntity } from './post.entity';

@Entity('series_posts')
@Unique(['seriesId', 'postId'])
export class SeriesPostEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'series_id' })
  seriesId: number;

  @ManyToOne(() => SeriesEntity, s => s.seriesPosts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'series_id' })
  series: SeriesEntity;

  @Column({ name: 'post_id' })
  postId: number;

  @ManyToOne(() => PostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: PostEntity;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;
}
