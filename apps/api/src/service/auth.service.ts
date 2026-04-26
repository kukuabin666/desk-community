/**
 * 账号领域服务：注册、登录、refresh、设备指纹与登录日志；抛业务错误码字符串由 Controller 映射为 HTTP + JSON。
 */
import { Provide, Inject, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { UserProfileEntity } from '../entity/user-profile.entity';
import { RefreshTokenEntity } from '../entity/refresh-token.entity';
import { UserDeviceEntity } from '../entity/user-device.entity';
import { LoginLogEntity } from '../entity/login-log.entity';
import { FavoriteFolderEntity } from '../entity/favorite-folder.entity';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { JwtService } from '@midwayjs/jwt';
import { SmsService } from './sms.service';
import { KvService } from './kv.service';

const USERNAME_RE = /^[a-zA-Z0-9]{6,20}$/;
const PHONE_RE = /^1\d{10}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/;

@Provide()
export class AuthService {
  @InjectEntityModel(UserEntity)
  userRepo: Repository<UserEntity>;

  @InjectEntityModel(UserProfileEntity)
  profileRepo: Repository<UserProfileEntity>;

  @InjectEntityModel(RefreshTokenEntity)
  refreshRepo: Repository<RefreshTokenEntity>;

  @InjectEntityModel(UserDeviceEntity)
  deviceRepo: Repository<UserDeviceEntity>;

  @InjectEntityModel(LoginLogEntity)
  loginLogRepo: Repository<LoginLogEntity>;

  @InjectEntityModel(FavoriteFolderEntity)
  folderRepo: Repository<FavoriteFolderEntity>;

  @Inject()
  jwt: JwtService;

  @Inject()
  sms: SmsService;

  @Inject()
  kv: KvService;

  @Config('desk')
  desk: { requireDeviceVerify?: boolean };

  assertUsername(u: string) {
    if (!USERNAME_RE.test(u)) throw new Error('BAD_USERNAME');
  }

  assertPhone(p: string) {
    if (!PHONE_RE.test(p)) throw new Error('BAD_PHONE');
  }

  assertPassword(p: string) {
    if (!PASSWORD_RE.test(p)) throw new Error('BAD_PASSWORD');
  }

  maskPhone(phone: string) {
    if (!phone || phone.length < 7) return phone;
    return `${phone.slice(0, 3)} ****${phone.slice(-4)}`;
  }

  /**
   * 确保为用户 userId 创建了一个“默认收藏夹”。
   * - 查询当前用户是否已有 isDefault: true 的收藏夹。
   * - 如果没有，则为该用户创建一个名为“默认收藏夹”的默认收藏夹。
   */
  private async ensureDefaultFolder(userId: number) {
    const exists = await this.folderRepo.findOne({
      where: { userId, isDefault: true },
    });
    if (!exists) {
      await this.folderRepo.save(
        this.folderRepo.create({ userId, name: '默认收藏夹', isDefault: true }),
      );
    }
  }

  async registerUsername(username: string, password: string) {
    this.assertUsername(username);
    this.assertPassword(password);
    const exists = await this.userRepo.findOne({ where: { username } });
    if (exists) throw new Error('USERNAME_TAKEN');
    // 密码仅存 bcrypt 摘要；profile / 默认收藏夹与 user 分表写入
    const hash = await bcrypt.hash(password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        username,
        phone: null,
        passwordHash: hash,
        onboardingDone: false,
        phoneVerified: false,
        role: 'user',
      }),
    );
    // 为新注册的用户在 profile 表中创建一条默认的用户档案数据（昵称为“用户+用户ID”、头像为空、兴趣标签为空数组）。
    await this.profileRepo.save(
      this.profileRepo.create({
        userId: user.id,
        nickname: `用户${user.id}`,
        avatar: '',
        interestTags: [],
      }),
    );
    await this.ensureDefaultFolder(user.id);
    return user;
  }

  async bindPhone(userId: number, phone: string, code: string) {
    this.assertPhone(phone);
    const ok = await this.sms.verifyCode(phone, code);
    if (!ok) throw new Error('BAD_SMS');
    // 手机号全局唯一：已被他人占用则拒绝
    const taken = await this.userRepo.findOne({ where: { phone } });
    if (taken && taken.id !== userId) throw new Error('PHONE_TAKEN');
    await this.userRepo.update({ id: userId }, { phone, phoneVerified: true });
  }

  async registerPhone(phone: string, code: string, password: string) {
    this.assertPhone(phone);
    this.assertPassword(password);
    const ok = await this.sms.verifyCode(phone, code);
    if (!ok) throw new Error('BAD_SMS');
    // 与用户名注册对称：无 username、phone 已验证，同样建 profile + 默认夹
    const exists = await this.userRepo.findOne({ where: { phone } });
    if (exists) throw new Error('PHONE_TAKEN');
    const hash = await bcrypt.hash(password, 10);
    const user = await this.userRepo.save(
      this.userRepo.create({
        username: null,
        phone,
        passwordHash: hash,
        onboardingDone: false,
        phoneVerified: true,
        role: 'user',
      }),
    );
    await this.profileRepo.save(
      this.profileRepo.create({
        userId: user.id,
        nickname: `用户${user.id}`,
        avatar: '',
        interestTags: [],
      }),
    );
    await this.ensureDefaultFolder(user.id);
    return user;
  }

  async loginPassword(input: {
    account: string;
    password: string;
    deviceId: string;
    ip: string;
    ua: string;
  }) {
    const { account, password, deviceId, ip, ua } = input;
    const user = PHONE_RE.test(account)
      ? await this.userRepo.findOne({ where: { phone: account } })
      : await this.userRepo.findOne({ where: { username: account } });
    if (!user) throw new Error('USER_NOT_FOUND');
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new Error('LOCKED');
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // 累计失败次数，满 5 次锁 30 分钟（计数清零由 lockedUntil 表达「已锁」）
      const attempts = user.failedLoginAttempts + 1;
      const patch: Partial<UserEntity> = { failedLoginAttempts: attempts };
      if (attempts >= 5) {
        patch.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        patch.failedLoginAttempts = 0;
      }
      await this.userRepo.update({ id: user.id }, patch);
      throw new Error('BAD_PASSWORD');
    }
    await this.userRepo.update(
      { id: user.id },
      { failedLoginAttempts: 0, lockedUntil: null },
    );
    // 仅 `DESK_REQUIRE_DEVICE_VERIFY=1` 时启用：新设备不发 token，走短信二次确认（pending 存 KV）
    const needDevice =
      !!this.desk?.requireDeviceVerify && (await this.checkNewDevice(user.id, deviceId));
    if (needDevice) {
      const token = randomBytes(24).toString('hex');
      await this.kv.set(
        `devpending:${token}`,
        JSON.stringify({ userId: user.id, deviceId }),
        600,
      );
      return { needDeviceVerify: true, pendingToken: token, userId: user.id };
    }
    await this.touchDevice(user.id, deviceId, ip, ua);
    await this.writeLoginLog(user.id, ip, ua, deviceId);
    return {
      needDeviceVerify: false,
      ...(await this.issueTokens(user, deviceId)),
    };
  }

  /** 短信登录：免密码，设备风控与密码登录相同 */
  async loginSms(
    phone: string,
    code: string,
    deviceId: string,
    ip: string,
    ua: string,
  ) {
    this.assertPhone(phone);
    const ok = await this.sms.verifyCode(phone, code);
    if (!ok) throw new Error('BAD_SMS');
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new Error('USER_NOT_FOUND');
    const needDevice =
      !!this.desk?.requireDeviceVerify && (await this.checkNewDevice(user.id, deviceId));
    if (needDevice) {
      const token = randomBytes(24).toString('hex');
      await this.kv.set(
        `devpending:${token}`,
        JSON.stringify({ userId: user.id, deviceId }),
        600,
      );
      return { needDeviceVerify: true, pendingToken: token, userId: user.id };
    }
    await this.touchDevice(user.id, deviceId, ip, ua);
    await this.writeLoginLog(user.id, ip, ua, deviceId);
    return {
      needDeviceVerify: false,
      ...(await this.issueTokens(user, deviceId)),
    };
  }

  async verifyDeviceStep(pendingToken: string, phone: string, code: string) {
    // 与 login 时写入的 devpending 对应；过期即视为无效链接
    const raw = await this.kv.get(`devpending:${pendingToken}`);
    if (!raw) throw new Error('PENDING_EXPIRED');
    const { userId, deviceId } = JSON.parse(raw) as {
      userId: number;
      deviceId: string;
    };
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.phone) throw new Error('NO_PHONE');
    if (user.phone !== phone) throw new Error('PHONE_MISMATCH');
    const ok = await this.sms.verifyCode(phone, code);
    if (!ok) throw new Error('BAD_SMS');
    await this.kv.del(`devpending:${pendingToken}`);
    await this.touchDevice(user.id, deviceId, '', '');
    await this.writeLoginLog(user.id, '', '', deviceId);
    return this.issueTokens(user, deviceId);
  }

  /** 忘记密码：短信校验通过后重置 hash，并清失败次数与锁 */
  async forgotPassword(phone: string, code: string, newPassword: string) {
    this.assertPhone(phone);
    this.assertPassword(newPassword);
    const ok = await this.sms.verifyCode(phone, code);
    if (!ok) throw new Error('BAD_SMS');
    const user = await this.userRepo.findOne({ where: { phone } });
    if (!user) throw new Error('USER_NOT_FOUND');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(
      { id: user.id },
      { passwordHash: hash, failedLoginAttempts: 0, lockedUntil: null },
    );
  }

  private async checkNewDevice(userId: number, deviceId: string) {
    if (!deviceId) return false;
    const d = await this.deviceRepo.findOne({ where: { userId, deviceId } });
    return !d;
  }

  private async touchDevice(
    userId: number,
    deviceId: string,
    ip: string,
    ua: string,
  ) {
    if (!deviceId) return;
    const label = this.deviceLabelFromUa(ua);
    const existing = await this.deviceRepo.findOne({
      where: { userId, deviceId },
    });
    if (existing) {
      await this.deviceRepo.update(
        { id: existing.id },
        {
          lastSeenAt: new Date(),
          lastIp: ip,
          deviceLabel: label || existing.deviceLabel,
        },
      );
    } else {
      await this.deviceRepo.save(
        this.deviceRepo.create({
          userId,
          deviceId,
          deviceLabel: label,
          lastIp: ip,
          lastLocation: '',
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
        }),
      );
    }
  }

  private deviceLabelFromUa(ua: string) {
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS 设备';
    if (/Android/i.test(ua)) return 'Android 设备';
    return 'Web 浏览器';
  }

  private async writeLoginLog(
    userId: number,
    ip: string,
    ua: string,
    deviceId: string,
  ) {
    await this.loginLogRepo.save(
      this.loginLogRepo.create({
        userId,
        ip,
        userAgent: ua,
        deviceLabel: deviceId ? `${deviceId.slice(0, 8)}…` : '',
        location: '',
      }),
    );
  }

  async loginAfterRegister(
    user: UserEntity,
    deviceId: string,
    ip: string,
    ua: string,
  ) {
    await this.touchDevice(user.id, deviceId, ip, ua);
    await this.writeLoginLog(user.id, ip, ua, deviceId);
    return this.issueTokens(user, deviceId);
  }

  private async issueTokens(user: UserEntity, deviceId: string) {
    const role = user.role === 'admin' ? 'admin' : 'user';
    const accessToken = await this.jwt.sign({ sub: String(user.id), role });
    // refresh 随机串落库；logout 时按 token + userId 删除即可吊销
    const refresh = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
    await this.refreshRepo.save(
      this.refreshRepo.create({
        userId: user.id,
        token: refresh,
        deviceId: deviceId || '',
        expiresAt,
      }),
    );
    return {
      accessToken,
      refreshToken: refresh,
      userId: user.id,
      role,
    };
  }

  async refresh(refreshToken: string) {
    // 只换 access，不轮转 refresh（若需更强安全可在此 rotate）
    const row = await this.refreshRepo.findOne({
      where: { token: refreshToken },
    });
    if (!row || row.expiresAt < new Date()) throw new Error('BAD_REFRESH');
    const user = await this.userRepo.findOne({ where: { id: row.userId } });
    if (!user) throw new Error('USER_NOT_FOUND');
    const role = user.role === 'admin' ? 'admin' : 'user';
    const accessToken = await this.jwt.sign({ sub: String(user.id), role });
    return { accessToken, userId: user.id, role };
  }

  async logout(userId: number, refreshToken?: string) {
    if (refreshToken) {
      await this.refreshRepo.delete({ token: refreshToken, userId });
    }
  }
}
