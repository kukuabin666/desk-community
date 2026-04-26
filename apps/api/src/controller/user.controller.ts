/**
 * 用户资料与「我的」：`/api/users/:id`、`/api/me/*`（设备、登录日志、隐私、onboarding 等）。
 * - 公开读用 `JwtOptionalMiddleware` 以便返回 `isSelf`、隐私字段等；写操作统一 `JwtAuthMiddleware`。
 */
import { Controller, Get, Post, Body, Param, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { JwtOptionalMiddleware } from '../middleware/jwt-optional.middleware';
import { UserService } from '../service/user.service';
import { ok, fail } from '../util/response';

@Controller('/api')
export class UserController {
  @Inject()
  user: UserService;

  @Get('/users/:id', { middleware: [JwtOptionalMiddleware] })
  async getUser(ctx: Context, @Param('id') id: string) {
    const uid = Number(id);
    const viewer = ctx.user?.id;
    const p = await this.user.getPublicProfile(uid, viewer);
    if (!p) {
      fail(ctx, 404, 404001, '用户不存在');
      return;
    }
    ok(ctx, p);
  }

  @Get('/me', { middleware: [JwtAuthMiddleware] })
  async me(ctx: Context) {
    const p = await this.user.getPublicProfile(ctx.user!.id, ctx.user!.id);
    ok(ctx, p);
  }

  @Post('/me', { middleware: [JwtAuthMiddleware] })
  async patchMe(ctx: Context, @Body() body: Record<string, unknown>) {
    try {
      const p = await this.user.updateProfile(ctx.user!.id, body as any);
      ok(ctx, p);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (m === 'BAD_NICK') fail(ctx, 400, 400101, '昵称长度需为2-12个字符');
      else if (m === 'NICK_TAKEN') fail(ctx, 409, 409101, '该昵称已被使用，请换一个');
      else if (m === 'NICK_MONTH_LIMIT')
        fail(ctx, 429, 429101, '昵称每月仅可修改1次');
      else fail(ctx, 400, 400199, m);
    }
  }

  @Post('/me/onboarding', { middleware: [JwtAuthMiddleware] })
  async onboarding(
    ctx: Context,
    @Body() body: { avatar: string; nickname: string; gender: string; interestTags?: string[] }
  ) {
    try {
      const p = await this.user.completeOnboarding(ctx.user!.id, body);
      ok(ctx, p);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      fail(ctx, 400, 400199, m);
    }
  }

  @Get('/me/devices', { middleware: [JwtAuthMiddleware] })
  async devices(ctx: Context) {
    ok(ctx, await this.user.listDevices(ctx.user!.id));
  }

  @Post('/me/devices/:pk/remove', { middleware: [JwtAuthMiddleware] })
  async delDevice(ctx: Context, @Param('pk') pk: string) {
    await this.user.removeDevice(ctx.user!.id, Number(pk));
    ok(ctx, { ok: true });
  }

  @Get('/me/login-logs', { middleware: [JwtAuthMiddleware] })
  async logs(ctx: Context) {
    ok(ctx, await this.user.listLoginLogs(ctx.user!.id));
  }
}
