/**
 * 收藏夹表（`favorite_folders`）：用户维度的收藏分组（如「默认收藏夹」、自定义夹）。
 *
 * - `isDefault`：标记默认夹，业务上通常保证每用户至少一个默认夹。
 * - `favorites`：一对多 `FavoriteEntity`，删除收藏夹时级联删除夹内收藏项（见子表 `onDelete`）。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { FavoriteEntity } from './favorite.entity';

@Entity('favorite_folders')
export class FavoriteFolderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ default: '默认收藏夹' })
  name: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @OneToMany(() => FavoriteEntity, f => f.folder, { cascade: true })
  favorites: FavoriteEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
