/**
 * 社交：关注/取关、粉丝与关注列表（尊重 profile 隐私开关）、作者获赞总数统计。
 */
import { Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { FollowEntity } from '../entity/follow.entity';
import { UserProfileEntity } from '../entity/user-profile.entity';
import { UserEntity } from '../entity/user.entity';
import { PostLikeEntity } from '../entity/post-like.entity';

@Provide()
export class SocialService {
  @InjectEntityModel(FollowEntity)
  followRepo: Repository<FollowEntity>;

  @InjectEntityModel(UserProfileEntity)
  profileRepo: Repository<UserProfileEntity>;

  @InjectEntityModel(UserEntity)
  userRepo: Repository<UserEntity>;

  @InjectEntityModel(PostLikeEntity)
  likeRepo: Repository<PostLikeEntity>;

  async counts(userId: number) {
    const following = await this.followRepo.count({ where: { followerId: userId } });
    const followers = await this.followRepo.count({ where: { followingId: userId } });
    // 只统计「别人帖子上的赞」：join post 再按作者过滤
    const likeCount = await this.likeRepo
      .createQueryBuilder('l')
      .innerJoin('l.post', 'p')
      .where('p.user_id = :uid', { uid: userId })
      .getCount();
    return { following, followers, likes: likeCount };
  }

  async follow(viewerId: number, targetId: number) {
    if (viewerId === targetId) throw new Error('SELF');
    const row = await this.followRepo.findOne({
      where: { followerId: viewerId, followingId: targetId },
    });
    if (!row) await this.followRepo.save(this.followRepo.create({ followerId: viewerId, followingId: targetId }));
    return { ok: true };
  }

  async unfollow(viewerId: number, targetId: number) {
    await this.followRepo.delete({ followerId: viewerId, followingId: targetId });
    return { ok: true };
  }

  async listFollowing(targetUserId: number, viewerId?: number) {
    // 非本人且对方关闭「关注列表公开」则直接返回 private
    const prof = await this.profileRepo.findOne({ where: { userId: targetUserId } });
    if (prof && !prof.followingPublic && viewerId !== targetUserId) {
      return { private: true as const, users: [] };
    }
    const rows = await this.followRepo.find({
      where: { followerId: targetUserId },
      order: { createdAt: 'DESC' },
    });
    const users: {
      id: number;
      nickname: string;
      avatar: string;
      bio: string;
      level: number;
    }[] = [];
    for (const r of rows) {
      const u = await this.packUser(r.followingId);
      if (u) users.push(u);
    }
    return { private: false as const, users };
  }

  async listFollowers(targetUserId: number, viewerId?: number) {
    const prof = await this.profileRepo.findOne({ where: { userId: targetUserId } });
    // 非本人且对方关闭「粉丝列表公开」
    if (prof && !prof.followersPublic && viewerId !== targetUserId) {
      return { private: true as const, users: [] };
    }
    const rows = await this.followRepo.find({
      where: { followingId: targetUserId },
      order: { createdAt: 'DESC' },
    });
    const users: {
      id: number;
      nickname: string;
      avatar: string;
      bio: string;
      level: number;
    }[] = [];
    for (const r of rows) {
      const u = await this.packUser(r.followerId);
      if (u) users.push(u);
    }
    return { private: false as const, users };
  }

  private async packUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['profile'] });
    if (!user) return null;
    return {
      id: user.id,
      nickname: user.profile?.nickname || '',
      avatar: user.profile?.avatar || '',
      bio: user.profile?.bio || '',
      level: user.level,
    };
  }
}
