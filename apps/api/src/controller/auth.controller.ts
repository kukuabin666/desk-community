/**
 * 认证与账号：`/api/auth/*`（注册、登录、短信、刷新令牌等）。
 * - 业务错误通过 `throw new Error('CODE')` + `mapAuthErr` 映射为 HTTP 状态与统一 JSON。
 * - `POST /login` 额外挂载 `LoginRateLimitMiddleware` 做 IP 维度限流。
 * - 含 `@Body()` 的方法须把 **`ctx: Context` 放在第一位**，否则注入的 `ctx` 可能不是 Koa 上下文，`fail`/`ok` 写不到响应上，客户端会收到 **204 无 body**。
 */
import { Controller, Post, Body, Inject } from '@midwayjs/core';
import { LoginRateLimitMiddleware } from '../middleware/login-rate-limit.middleware';
import { JwtService } from '@midwayjs/jwt';
import { Context } from '@midwayjs/koa';
import { AuthService } from '../service/auth.service';
import { SmsService } from '../service/sms.service';
import { ok, fail } from '../util/response';

function mapAuthErr(e: unknown): { status: number; code: number; msg: string } {
  const m = e instanceof Error ? e.message : String(e);
  const table: Record<string, { status: number; code: number; msg: string }> = {
    USERNAME_TAKEN: { status: 409, code: 409001, msg: '该账号已被注册，请更换或直接登录' },
    PHONE_TAKEN: { status: 409, code: 409002, msg: '该手机号已注册，请直接登录' },
    BAD_USERNAME: { status: 400, code: 400001, msg: '账号需为6-20位字母或数字' },
    BAD_PHONE: { status: 400, code: 400002, msg: '请输入正确的手机号' },
    BAD_PASSWORD: { status: 400, code: 400003, msg: '密码需为8-20位，包含字母和数字' },
    BAD_SMS: { status: 400, code: 400004, msg: '验证码错误或已过期' },
    USER_NOT_FOUND: { status: 404, code: 404001, msg: '该账号未注册，请先注册' },
    LOCKED: { status: 423, code: 423001, msg: '账号已被锁定，请30分钟后重试或联系客服' },
    SMS_DAY_LIMIT: { status: 429, code: 429001, msg: '今日发送次数已达上限，请明日再试' },
    SMS_COOLDOWN: { status: 429, code: 429002, msg: '操作过于频繁，请60秒后重试' },
    BAD_REFRESH: { status: 401, code: 401002, msg: '刷新令牌无效' },
    PENDING_EXPIRED: { status: 400, code: 400005, msg: '验证已过期，请重新登录' },
    PHONE_MISMATCH: { status: 400, code: 400006, msg: '手机号与账号不匹配' },
    NO_PHONE: { status: 400, code: 400007, msg: '账号未绑定手机号，无法完成验证' },
  };
  if (m === 'BAD_PASSWORD')
    return { status: 401, code: 401003, msg: '密码错误，还可尝试多次' };
  return table[m] || { status: 500, code: 500001, msg: m || '服务器错误' };
}

@Controller('/api/auth')
export class AuthController {
  @Inject()
  auth: AuthService;

  @Inject()
  sms: SmsService;

  @Inject()
  jwt: JwtService;

  @Post('/sms/send')
  async sendSms(ctx: Context, @Body() body: { phone: string }) {
    try {
      const r = await this.sms.sendCode(body.phone);
      ok(ctx, r);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  /**
   * 该方法用于通过用户名和密码注册新账号，对应接口 POST /api/auth/register/username。
   * 
   * 典型流程如下：
   * 1. 用户在注册页填写用户名与密码后，客户端调用该接口。
   * 2. 服务端先调用 this.auth.registerUsername 检查参数、可用性、并创建用户。
   * 3. 注册成功后，会自动登录：获取 deviceId（设备标识）、ip、user-agent（用于设备关联和安全追踪），调用 this.auth.loginAfterRegister 生成 token 等登录信息。
   * 4. 最后返回 tokens，前端可以直接进入已登录状态。
   * 
   * 只有当用户选择用「用户名密码」方式注册账号时（区别于手机号验证码注册），请求才会进入这里。
   * 如果在注册过程中出现错误（如用户名已被占用、不合法等），会被捕获并通过 mapAuthErr 格式化后返回给前端。
   */
  @Post('/register/username')
  async regUser(ctx: Context, @Body() body: { username: string; password: string }) {
    try {
      const user = await this.auth.registerUsername(body.username, body.password);
      const deviceId = ctx.get('x-device-id') || '';
      const tokens = await this.auth.loginAfterRegister(
        user,
        deviceId,
        ctx.ip,
        ctx.get('user-agent') || ''
      );
      ok(ctx, tokens);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/register/phone')
  async regPhone(
    ctx: Context,
    @Body() body: { phone: string; code: string; password: string }
  ) {
    try {
      const user = await this.auth.registerPhone(body.phone, body.code, body.password);
      const deviceId = ctx.get('x-device-id') || '';
      const tokens = await this.auth.loginAfterRegister(
        user,
        deviceId,
        ctx.ip,
        ctx.get('user-agent') || ''
      );
      ok(ctx, tokens);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/login', { middleware: [LoginRateLimitMiddleware] })
  async login(
    ctx: Context,
    @Body() body: { account: string; password: string }
  ) {
    try {
      const deviceId = ctx.get('x-device-id') || '';
      const r = await this.auth.loginPassword({
        account: body.account,
        password: body.password,
        deviceId,
        ip: ctx.ip,
        ua: ctx.get('user-agent') || '',
      });
      ok(ctx, r);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/login/sms')
  async loginSms(
    ctx: Context,
    @Body() body: { phone: string; code: string }
  ) {
    try {
      const deviceId = ctx.get('x-device-id') || '';
      const r = await this.auth.loginSms(
        body.phone,
        body.code,
        deviceId,
        ctx.ip,
        ctx.get('user-agent') || ''
      );
      ok(ctx, r);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/device/verify')
  async devVerify(ctx: Context, @Body() body: { pendingToken: string; phone: string; code: string }) {
    try {
      const r = await this.auth.verifyDeviceStep(body.pendingToken, body.phone, body.code);
      ok(ctx, r);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/bind-phone')
  async bindPhone(ctx: Context, @Body() body: { phone: string; code: string }) {
    const h = ctx.get('authorization');
    const token = h?.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : '';
    if (!token) {
      fail(ctx, 401, 401001, '请先登录');
      return;
    }
    try {
      const payload = (await this.jwt.verify(token)) as unknown as { sub: string };
      const userId = Number(payload.sub);
      await this.auth.bindPhone(userId, body.phone, body.code);
      ok(ctx, { ok: true });
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/refresh')
  async refresh(ctx: Context, @Body() body: { refreshToken: string }) {
    try {
      const r = await this.auth.refresh(body.refreshToken);
      ok(ctx, r);
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }

  @Post('/forgot')
  async forgot(ctx: Context, @Body() body: { phone: string; code: string; newPassword: string }) {
    try {
      await this.auth.forgotPassword(body.phone, body.code, body.newPassword);
      ok(ctx, { ok: true });
    } catch (e) {
      const x = mapAuthErr(e);
      fail(ctx, x.status, x.code, x.msg);
    }
  }
}
