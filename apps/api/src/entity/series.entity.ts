/**
 * 合集表（`series`）：用户将多篇帖子组织成主题系列（如装修日记连载）。
 *
 * - `owner`：`userId` 指向作者；用户删除时合集 CASCADE。
 * - `seriesPosts`：通过中间表 `SeriesPostEntity` 关联多篇 `PostEntity`，支持排序与去重。
 * - `sortIndex`：合集列表排序；`viewCount`：合集详情访问统计。
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
import { SeriesPostEntity } from './series-post.entity';

@Entity('series')
export class SeriesEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner: UserEntity;

  @Column({ length: 64 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ name: 'cover_url', default: '' })
  coverUrl: string;

  @Column({ name: 'sort_index', default: 0 })
  sortIndex: number;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @OneToMany(() => SeriesPostEntity, sp => sp.series, { cascade: true })
  seriesPosts: SeriesPostEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
