/**
 * 管理端商品 CRUD：`/api/admin/products*`，需登录且 `role=admin`（与 H5/Web 共用同一 JWT 签发）。
 */
import { Controller, Get, Post, Put, Body, Param, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { AdminAuthMiddleware } from '../middleware/admin-auth.middleware';
import { ProductAdminService } from '../service/product-admin.service';
import { ok, fail } from '../util/response';

const admin = { middleware: [JwtAuthMiddleware, AdminAuthMiddleware] };

@Controller('/api/admin')
export class AdminProductController {
  @Inject()
  products: ProductAdminService;

  @Get('/products', admin)
  async list(ctx: Context) {
    ok(ctx, await this.products.listAll());
  }

  @Post('/products', admin)
  async create(
    ctx: Context,
    @Body() body: { name: string; coverUrl?: string; priceText?: string; description?: string }
  ) {
    try {
      if (!body?.name?.trim()) {
        fail(ctx, 400, 400701, '商品名称必填');
        return;
      }
      ok(ctx, await this.products.create(body));
    } catch (e) {
      fail(ctx, 400, 400799, e instanceof Error ? e.message : String(e));
    }
  }

  @Put('/products/:id', admin)
  async update(
    ctx: Context,
    @Param('id') id: string,
    @Body() body: Partial<{ name: string; coverUrl: string; priceText: string; description: string }>
  ) {
    try {
      ok(ctx, await this.products.update(Number(id), body));
    } catch (e) {
      if (e instanceof Error && e.message === 'PRODUCT_NOT_FOUND') {
        fail(ctx, 404, 404701, '商品不存在');
        return;
      }
      fail(ctx, 400, 400799, e instanceof Error ? e.message : String(e));
    }
  }

  @Post('/products/:id/remove', admin)
  async remove(ctx: Context, @Param('id') id: string) {
    try {
      await this.products.remove(Number(id));
      ok(ctx, { ok: true });
    } catch (e) {
      if (e instanceof Error && e.message === 'PRODUCT_NOT_FOUND') {
        fail(ctx, 404, 404701, '商品不存在');
        return;
      }
      fail(ctx, 400, 400799, e instanceof Error ? e.message : String(e));
    }
  }
}
