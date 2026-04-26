/**
 * 小店商品：`/api/shop/*`（列表、详情）；当前多为读模型，占位扩展购物车等。
 */
import { Controller, Get, Param } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../entity/product.entity';
import { ok, fail } from '../util/response';

@Controller('/api/shop')
export class ShopController {
  @InjectEntityModel(ProductEntity)
  productRepo: Repository<ProductEntity>;

  @Get('/products')
  async list(ctx: Context) {
    const list = await this.productRepo.find({ order: { id: 'ASC' }, take: 50 });
    ok(ctx, list);
  }

  @Get('/products/:id')
  async one(ctx: Context, @Param('id') id: string) {
    const p = await this.productRepo.findOne({ where: { id: Number(id) } });
    if (!p) {
      fail(ctx, 404, 404001, '商品不存在');
      return;
    }
    ok(ctx, p);
  }
}
