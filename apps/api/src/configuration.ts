/**
 * Midway 应用装配入口：注册 Koa、校验、跨域、TypeORM、上传、静态资源、JWT 等组件。
 * - `onReady`：确保 data/uploads 目录存在；执行 SeedService 初始化内置数据；挂载请求耗时响应头。
 * - 业务路由由各 `@Controller` 注册；环境变量见 `src/config/config.default.ts`。
 */
import { Configuration, App, Inject } from '@midwayjs/core';
import * as koa from '@midwayjs/koa';
import * as validate from '@midwayjs/validate';
import * as crossDomain from '@midwayjs/cross-domain';
import * as orm from '@midwayjs/typeorm';
import * as upload from '@midwayjs/upload';
import * as staticFile from '@midwayjs/static-file';
import * as jwt from '@midwayjs/jwt';
import { join } from 'path';
import { SeedService } from './service/seed.service';

@Configuration({
  imports: [koa, validate, crossDomain, orm, upload, staticFile, jwt],
  importConfigs: [join(__dirname, './config')],
})
export class MainConfiguration {
  @App('koa')
  app: koa.Application;

  @Inject()
  seedService: SeedService;

  async onReady() {
    await this.seedService.seed();
    this.app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      ctx.set('X-Response-Time', `${Date.now() - start}ms`);
    });
  }
}
