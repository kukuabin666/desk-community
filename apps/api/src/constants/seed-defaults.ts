/**
 * 空库时的默认种子数据，与 `SeedService` 使用的实体字段对齐。
 * 修改展示文案、等级阶梯或积分规则时优先改此文件，避免在 Service 里堆字面量。
 */

export const SEED_LEVEL_ROWS = [
  { level: 1, name: '新手', minExp: 0 },
  { level: 2, name: '入门', minExp: 50 },
  { level: 3, name: '熟练', minExp: 200 },
  { level: 4, name: '达人', minExp: 500 },
  { level: 5, name: '专家', minExp: 1200 },
  { level: 6, name: '大师', minExp: 3000 },
  { level: 7, name: '传奇', minExp: 8000 },
] as const;

export const SEED_POINT_RULE_ROWS = [
  // 每日签到，每天仅限一次
  { action: 'daily_sign', points: 5, dailyCap: 1 },
  // 发帖奖励，每天最多5次
  { action: 'post_create', points: 10, dailyCap: 5 },
  // 评论奖励，每天最多20次
  { action: 'comment_create', points: 2, dailyCap: 20 },
  // 帖子被点赞奖励，无每日上限
  { action: 'post_liked', points: 1, dailyCap: null },
  // 帖子被收藏奖励，无每日上限
  { action: 'post_favorited', points: 2, dailyCap: null },
  // 分享帖子，每天最多5次
  { action: 'share_post', points: 3, dailyCap: 5 },
  // 邀请好友注册，每邀请1人奖励，无每日上限
  { action: 'invite_register', points: 50, dailyCap: null },
  // AI图片生成，每生成一次扣除20积分，无上限
  { action: 'image_generate', points: -20, dailyCap: null },
] as const;

/** 首页 Feed 插入位默认横幅（`BannerEntity.sortOrder` 走库 default） */
export const SEED_HOME_BANNER = {
  title: '欢迎来到桌搭社区',
  imageUrl: 'https://picsum.photos/800/320',
  linkUrl: '/home',
  insertAfter: 10,
  active: true,
} as const;

export const SEED_SAMPLE_PRODUCTS = [
  {
    name: '[商品名称占位]',
    coverUrl: 'https://picsum.photos/seed/p1/400/400',
    priceText: '¥11',
    description: '[商品详情占位]',
  },
  {
    name: '[商品名称占位2]',
    coverUrl: 'https://picsum.photos/seed/p2/400/400',
    priceText: '¥22',
    description: '[商品详情占位]',
  },
] as const;
