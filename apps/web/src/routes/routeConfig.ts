/**
 * 应用路由表（单一数据源）。
 *
 * 设计取舍（常见坑）：
 * - 不用纯 JSON：路由要绑 `React.lazy`、`RequireAuth` 等运行时引用，JSON 无法表达，最终会拆成「JSON + 映射表」双份维护。
 * - 不用 `import.meta.glob` 扫 `pages/`：当前是 `pages/<dir>/index.tsx` **具名导出**，且目录名与 URL 不一一对应（如 `user-profile` → `/user/:id`），自动扫容易错、类型也更弱。
 * - `layout: 'shell'` 段的 **path 顺序** 决定 `SHELL_TAB_PATHS`（底部 Tab 高亮前缀匹配）；须与 `ShellLayout.tsx` 里 `SHELL_TABS` 的 **key 顺序一致**，否则 Tab 与 `activeKey` 错位。
 * - 同前缀的静态段写在动态段前（如 `/user/:id/follow` 在 `/user/:id` 前），避免误匹配。
 * - `path: '*'` 的兜底项**不要**指望「写在数组最后」就安全：`AppRoutes.tsx` 会把它单独渲染在 `ShellLayout` **之后**，否则 `*` 会先匹配掉 `/home` 等所有路径。
 */
import type { PageKey } from './pages';

export type RouteLayout = 'root' | 'shell';

export type AppRouteDef =
  | {
      path: string;
      layout: RouteLayout;
      redirectTo: string;
    }
  | {
      path: string;
      layout: RouteLayout;
      page: PageKey;
      auth?: boolean;
    };

/** 同文件顶部注释：顺序、shell 与 Tab、通配符渲染位置。 */
export const APP_ROUTES: AppRouteDef[] = [
  { path: '/login', layout: 'root', page: 'LoginPage' },
  { path: '/register', layout: 'root', page: 'RegisterPage' },
  { path: '/forgot', layout: 'root', page: 'ForgotPage' },
  { path: '/onboarding', layout: 'root', page: 'OnboardingPage', auth: true },
  { path: '/post/:id', layout: 'root', page: 'PostDetailPage' },
  { path: '/series/:id', layout: 'root', page: 'SeriesDetailPage' },
  { path: '/user/:id/follow', layout: 'root', page: 'FollowListPage' },
  { path: '/user/:id', layout: 'root', page: 'UserProfilePage' },
  { path: '/search', layout: 'root', page: 'SearchPage' },
  { path: '/product/:id', layout: 'root', page: 'ProductDetailPage' },
  { path: '/series-manage', layout: 'root', page: 'SeriesManagePage', auth: true },
  { path: '/points', layout: 'root', page: 'PointsPage', auth: true },
  { path: '/settings', layout: 'root', page: 'SettingsPage', auth: true },
  { path: '/', layout: 'shell', redirectTo: '/home' },
  { path: '/home', layout: 'shell', page: 'HomePage' },
  { path: '/shop', layout: 'shell', page: 'ShopPage' },
  { path: '/publish', layout: 'shell', page: 'PublishPage', auth: true },
  { path: '/messages', layout: 'shell', page: 'MessagesPage' },
  { path: '/me', layout: 'shell', page: 'MePage' },
  { path: '*', layout: 'root', redirectTo: '/home' },
];

/**
 * Shell 内「真实页面」的 path 列表（不含仅 redirect 的 `/`）。
 * 顺序来自 `APP_ROUTES` 里 `layout: 'shell'` 且含 `page` 的条目顺序，与 `ShellLayout` 的 `SHELL_TABS[].key` 一一对应。
 */
export const SHELL_TAB_PATHS = APP_ROUTES.filter(
  (r): r is Extract<AppRouteDef, { page: PageKey }> => r.layout === 'shell' && 'page' in r
).map(r => r.path);
