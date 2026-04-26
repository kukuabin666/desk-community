/**
 * 懒加载页面注册表（与 `routeConfig.ts` 中的 `PageKey` 一一对应）。
 *
 * 集中维护的原因见 `routeConfig.ts` 文件头注释（为何不 JSON、为何不 glob）。
 * 新增页面：`lazyNamed` 一行 + `routeConfig` 一条；两处 `PageKey` 拼写需一致，否则 TS 会报错。
 */
import { lazyNamed } from './lazyNamed';
export const Pages = {
  HomePage: lazyNamed(() => import('../pages/home'), 'HomePage'),
  LoginPage: lazyNamed(() => import('../pages/login'), 'LoginPage'),
  RegisterPage: lazyNamed(() => import('../pages/register'), 'RegisterPage'),
  ForgotPage: lazyNamed(() => import('../pages/forgot'), 'ForgotPage'),
  OnboardingPage: lazyNamed(() => import('../pages/onboarding'), 'OnboardingPage'),
  ShopPage: lazyNamed(() => import('../pages/shop'), 'ShopPage'),
  MessagesPage: lazyNamed(() => import('../pages/messages'), 'MessagesPage'),
  MePage: lazyNamed(() => import('../pages/me'), 'MePage'),
  UserProfilePage: lazyNamed(() => import('../pages/user-profile'), 'UserProfilePage'),
  PostDetailPage: lazyNamed(() => import('../pages/post-detail'), 'PostDetailPage'),
  PublishPage: lazyNamed(() => import('../pages/publish'), 'PublishPage'),
  SeriesDetailPage: lazyNamed(() => import('../pages/series-detail'), 'SeriesDetailPage'),
  SeriesManagePage: lazyNamed(() => import('../pages/series-manage'), 'SeriesManagePage'),
  FollowListPage: lazyNamed(() => import('../pages/follow-list'), 'FollowListPage'),
  PointsPage: lazyNamed(() => import('../pages/points'), 'PointsPage'),
  SettingsPage: lazyNamed(() => import('../pages/settings'), 'SettingsPage'),
  SearchPage: lazyNamed(() => import('../pages/search'), 'SearchPage'),
  ProductDetailPage: lazyNamed(() => import('../pages/product-detail'), 'ProductDetailPage'),
} as const;

export type PageKey = keyof typeof Pages;
