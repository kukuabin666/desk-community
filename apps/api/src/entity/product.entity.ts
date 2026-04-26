/**
 * 商品/橱窗占位表（`products`）：示例电商或「好物」模块的静态列表数据，便于演示与种子填充。
 *
 * - `priceText` 使用文案而非数值金额，适配展示占位与多币种前的简化模型。
 * - 与订单、库存无关联时为纯内容表；扩展时可增加 SKU、上下架等字段。
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'cover_url', default: '' })
  coverUrl: string;

  @Column({ name: 'price_text', default: '[价格占位]' })
  priceText: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
