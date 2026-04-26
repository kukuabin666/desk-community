/**
 * 通用能力：`GET /api/health` 探活；`POST /api/common/upload` 需登录，文件落盘到 `uploads/public` 并由静态路由对外提供。
 */
import { Controller, Get, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { UploadFileInfo } from '@midwayjs/upload';
import { ok, fail } from '../util/response';
import { copyFile } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

@Controller('/api')
export class CommonController {
  @Get('/health')
  async health(ctx: Context) {
    ok(ctx, { status: 'ok', service: 'desk-community-api' });
  }

  @Post('/common/upload', { middleware: [JwtAuthMiddleware] })
  async upload(ctx: Context) {
    const files = ctx.files as UploadFileInfo<string>[] | undefined;
    const f = files?.[0];
    if (!f?.data) {
      fail(ctx, 400, 400601, '未选择文件');
      return;
    }
    const ext = (f.filename || '.jpg').includes('.')
      ? f.filename!.slice(f.filename!.lastIndexOf('.'))
      : '.jpg';
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    const publicDir = join(__dirname, '../../uploads/public');
    if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
    const dest = join(publicDir, name);
    try {
      await copyFile(f.data as string, dest);
    } catch {
      fail(ctx, 500, 500601, '保存文件失败');
      return;
    }
    const url = `/uploads/${name}`;
    ok(ctx, { url });
  }
}
