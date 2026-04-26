/**
 * 收藏表（`favorites`）：用户将帖子收藏到指定收藏夹。
 *
 * - `@Unique(['userId', 'postId', 'folderId'])`：同一用户在同一夹内对同一帖只保留一条；
 *   若支持「同一帖多夹」，应通过不同 `folderId` 区分；若业务禁止重复收藏到多夹需额外校验。
 * - `post`、`folder`、`user` 删除均 CASCADE，避免悬挂收藏。
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
import { FavoriteFolderEntity } from './favorite-folder.entity';

@Entity('favorites')
@Unique(['userId', 'postId', 'folderId'])
export class FavoriteEntity {
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

  @Column({ name: 'folder_id' })
  folderId: number;

  @ManyToOne(() => FavoriteFolderEntity, f => f.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folder_id' })
  folder: FavoriteFolderEntity;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
