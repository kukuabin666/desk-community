/**
 * 草稿表（`drafts`）：按用户 + 草稿类型唯一，存未发布的表单 JSON。
 *
 * - `@Unique(['userId', 'kind'])`：每种 `kind`（如 `publish_share`、`publish_renovation`）每用户最多一条草稿；
 *   保存时 upsert：`payload` 为序列化后的编辑器状态。
 * - `updatedAt`：最后自动保存时间；无 `createdAt` 时可用 `updatedAt` 或主键推断首次创建。
 * - 用户删除时 CASCADE。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('drafts')
@Unique(['userId', 'kind'])
export class DraftEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  /** e.g. publish_share | publish_renovation */
  @Column({ default: 'publish_share' })
  kind: string;

  @Column({ type: 'text' })
  payload: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
