import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entity/product.entity';

@Provide()
export class ProductAdminService {
  @InjectEntityModel(ProductEntity)
  productRepo: Repository<ProductEntity>;

  async listAll() {
    return this.productRepo.find({ order: { id: 'DESC' } });
  }

  async create(input: {
    name: string;
    coverUrl?: string;
    priceText?: string;
    description?: string;
  }) {
    return this.productRepo.save(
      this.productRepo.create({
        name: input.name,
        coverUrl: input.coverUrl ?? '',
        priceText: input.priceText ?? '¥--',
        description: input.description ?? '',
      })
    );
  }

  async update(
    id: number,
    patch: Partial<{ name: string; coverUrl: string; priceText: string; description: string }>
  ) {
    const row = await this.productRepo.findOne({ where: { id } });
    if (!row) throw new Error('PRODUCT_NOT_FOUND');
    Object.assign(row, patch);
    return this.productRepo.save(row);
  }

  async remove(id: number) {
    const r = await this.productRepo.delete({ id });
    if (!r.affected) throw new Error('PRODUCT_NOT_FOUND');
  }
}
