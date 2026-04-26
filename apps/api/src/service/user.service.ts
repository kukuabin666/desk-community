/**
 * 用户资料与账号周边：公开展示、资料更新、新手引导完成、设备与登录日志查询。
 */
import { Provide, Inject } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { UserProfileEntity } from '../entity/user-profile.entity';
import { UserDeviceEntity } from '../entity/user-device.entity';
import { LoginLogEntity } from '../entity/login-log.entity';
import { AuthService } from './auth.service';

const NICK_RE = /^.{2,12}$/;

@Provide()
export class UserService {
  @InjectEntityModel(UserEntity)
  userRepo: Repository<UserEntity>;

  @InjectEntityModel(UserProfileEntity)
  profileRepo: Repository<UserProfileEntity>;

  @InjectEntityModel(UserDeviceEntity)
  deviceRepo: Repository<UserDeviceEntity>;

  @InjectEntityModel(LoginLogEntity)
  loginLogRepo: Repository<LoginLogEntity>;

  @Inject()
  auth: AuthService;

  async getPublicProfile(userId: number, viewerId?: number) {
    // 聚合 user + profile；手机号仅脱敏展示
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['profile'] });
    if (!user) return null;
    const p = user.profile;
    return {
      id: user.id,
      nickname: p?.nickname || '',
      avatar: p?.avatar || '',
      bio: p?.bio || '',
      gender: p?.gender || 'secret',
      level: user.level,
      expTotal: user.expTotal,
      pointsBalance: user.pointsBalance,
      layoutMode: p?.layoutMode || 'double',
      followersPublic: p?.followersPublic ?? true,
      followingPublic: p?.followingPublic ?? true,
      phoneMasked: user.phone ? this.auth.maskPhone(user.phone) : '',
      onboardingDone: user.onboardingDone,
      isSelf: viewerId === userId,
      ...(viewerId === userId
        ? { role: user.role === 'admin' ? 'admin' : 'user' }
        : {}),
    };
  }

  async updateProfile(
    userId: number,
    patch: Partial<{
      nickname: string;
      avatar: string;
      gender: string;
      bio: string;
      birthday: string;
      region: string;
      layoutMode: string;
      followersPublic: boolean;
      followingPublic: boolean;
      interestTags: string[];
    }>
  ) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) throw new Error('NO_PROFILE');
    if (patch.nickname != null) {
      if (!NICK_RE.test(patch.nickname)) throw new Error('BAD_NICK');
      // 全站昵称唯一（排除自己）；改昵称有自然月冷却
      const dup = await this.profileRepo
        .createQueryBuilder('p')
        .where('p.nickname = :n AND p.user_id != :uid', { n: patch.nickname, uid: userId })
        .getOne();
      if (dup) throw new Error('NICK_TAKEN');
      const now = new Date();
      if (profile.nicknameChangedAt) {
        const m = new Date(profile.nicknameChangedAt);
        m.setMonth(m.getMonth() + 1);
        if (patch.nickname !== profile.nickname && m > now) throw new Error('NICK_MONTH_LIMIT');
      }
      profile.nickname = patch.nickname;
      profile.nicknameChangedAt = now;
    }
    if (patch.avatar != null) profile.avatar = patch.avatar;
    if (patch.gender != null) profile.gender = patch.gender;
    if (patch.bio != null) profile.bio = patch.bio;
    if (patch.birthday != null) profile.birthday = patch.birthday;
    if (patch.region != null) profile.region = patch.region;
    if (patch.layoutMode != null) profile.layoutMode = patch.layoutMode;
    if (patch.followersPublic != null) profile.followersPublic = patch.followersPublic;
    if (patch.followingPublic != null) profile.followingPublic = patch.followingPublic;
    if (patch.interestTags != null) profile.interestTags = patch.interestTags;
    await this.profileRepo.save(profile);
    return this.getPublicProfile(userId, userId);
  }

  /** 首次完善资料：写 profile 后打标 onboardingDone，前端可放开主流程 */
  async completeOnboarding(
    userId: number,
    body: {
      avatar: string;
      nickname: string;
      gender: string;
      interestTags?: string[];
    }
  ) {
    await this.updateProfile(userId, {
      avatar: body.avatar,
      nickname: body.nickname,
      gender: body.gender,
      interestTags: body.interestTags || [],
    });
    await this.userRepo.update({ id: userId }, { onboardingDone: true });
    return this.getPublicProfile(userId, userId);
  }

  async listDevices(userId: number) {
    return this.deviceRepo.find({
      where: { userId },
      order: { lastSeenAt: 'DESC' },
    });
  }

  async removeDevice(userId: number, devicePk: number) {
    await this.deviceRepo.delete({ id: devicePk, userId });
  }

  async listLoginLogs(userId: number) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    // 按时间倒序；take 限制单次返回量（since 可后续接 where 做近 30 天过滤）
    return this.loginLogRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
