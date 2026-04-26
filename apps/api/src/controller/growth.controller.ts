/**
 * 成长体系：等级规则、积分流水、积分申请等（`/api/growth/*`、`/api/me/points/*`），敏感接口带 `JwtAuthMiddleware`。
 */
import { Controller, Get, Post, Body, Inject, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { JwtAuthMiddleware } from '../middleware/jwt-auth.middleware';
import { GrowthService } from '../service/growth.service';
import { ok, fail } from '../util/response';

@Controller('/api')
export class GrowthController {
  @Inject()
  growth: GrowthService;

  @Get('/growth/rules')
  async rules(ctx: Context) {
    ok(ctx, await this.growth.getRules());
  }

  @Get('/me/points/ledger', { middleware: [JwtAuthMiddleware] })
  async ledger(
    ctx: Context,
    @Query('type') type: 'earn' | 'spend' = 'earn',
    @Query('cursor') cursor?: string
  ) {
    ok(
      ctx,
      await this.growth.getPointsLedger(
        ctx.user!.id,
        type === 'spend' ? 'spend' : 'earn',
        cursor ? Number(cursor) : undefined
      )
    );
  }

  @Post('/me/points/apply', { middleware: [JwtAuthMiddleware] })
  async apply(ctx: Context, @Body() body: { action: string; memo?: string }) {
    try {
      const r = await this.growth.applyAction(ctx.user!.id, body.action, body.memo || '');
      ok(ctx, r);
    } catch (e) {
      if (e instanceof Error && e.message === 'POINTS_NOT_ENOUGH')
        fail(ctx, 400, 400501, '积分不足');
      else fail(ctx, 400, 400599, e instanceof Error ? e.message : String(e));
    }
  }
}
