/**
 * 运营横幅表（`banners`）：首页或 feed 流中插入的广告位 / 活动图。
 *
 * - `imageUrl` / `linkUrl`：展示图与点击跳转；`linkUrl` 可为空表示纯展示。
 * - `insertAfter`：在第几条 feed 后插入（与客户端协议对齐）；`sortOrder`：多条 banner 的排序权重。
 * - `active`：软开关，下线不改历史数据。
 */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('banners')
export class BannerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'link_url', default: '' })
  linkUrl: string;

  @Column({ name: 'insert_after', type: 'int', default: 10 })
  insertAfter: number;

  @Column({ name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ name: 'active', default: true })
  active: boolean;
}
