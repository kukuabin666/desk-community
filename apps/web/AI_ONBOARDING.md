# apps/web — AI / 开发者快速上手

面向在本目录（`apps/web`）里改前端代码的 **人类** 与 **AI Agent**：先读本文件，再按需打开下方路径中的源码（关键处已有中文块注释）。

---

## 1. 技术栈与命令

| 项 | 说明 |
|----|------|
| 构建 | Vite 6 + React 18 + TypeScript |
| 路由 | `react-router-dom` v6（`BrowserRouter`、`Routes`、`Outlet`） |
| UI | `antd-mobile` + `antd-mobile-icons` |
| 样式 | **CSS Modules + Less**（`*.module.less`）；全局变量在 `src/styles/tokens.less`（由 Vite 注入到各 module） |
| 请求 | `axios` 封装在 `src/api/client.ts` |
| 服务端状态（部分页） | `@tanstack/react-query` v5，在 `src/main.tsx` 注入全局 `QueryClient` |

```bash
cd apps/web && npm install && npm run dev   # 默认端口见 vite.config.ts（5173）
cd apps/web && npm run build                # tsc -b && vite build
```

---

## 2. 启动链路（从入口到路由）

```
index.html
  → src/main.tsx          # createRoot、QueryClientProvider、antd ConfigProvider、StrictMode
  → src/App.tsx           # BrowserRouter、AuthProvider、Suspense、Routes
```

- **`main.tsx`**：全局只初始化一次；`queries.refetchOnWindowFocus: false` 减少无谓重请求。
- **`App.tsx`**：所有业务页面使用 **`React.lazy`** + 顶层 **`Suspense`**（fallback 用 **`PageCenterLoading`**）。具名导出的页面用 `.then(m => ({ default: m.XxxPage }))` 转成 `default` 供 `lazy` 使用。
- **`AuthProvider`**（`src/auth/AuthContext.tsx`）：读 `localStorage` 的 `desk_at` / `desk_rt`，有 token 时 `setAuthHeader` 并拉 `GET /me`。
- **`RequireAuth`**：未登录跳转 `/login`；`loading` 时展示 **`PageCenterLoading`**，**不渲染**子路由（含懒加载 chunk）。

---

## 3. 路由与布局约定（改页面必看）

### 3.1 谁在「壳」里？

- **`ShellLayout`**（`src/layouts/ShellLayout.tsx`）只作为 **嵌套路由父级**，包住：

  `/` → `/home`、`/shop`、`/messages`、`/me`、`/publish`（部分需 `RequireAuth`）

- **不在壳里**的示例：`/login`、`/post/:id`、`/user/:id`、`/settings` 等 → **无底部 TabBar**。

### 3.2 壳 ↔ 首页刷新

- 用户在 **已是 `/home`** 时再次点 Tab「首页」：`ShellLayout` 派发 **`window` 事件 `desk:home-refresh`**。
- **`pages/home`**（`HomePage` 组件）监听该事件，对 TanStack Query 执行 **`queryClient.resetQueries({ queryKey: ['feed'] })`**，与下拉刷新一致，从第一页重拉 Feed。

---

## 4. 数据与 API

### 4.1 `src/api/client.ts`

- **`api`**：`axios` 实例，`baseURL` 为 `import.meta.env.VITE_API_BASE || '/api'`。
- **`setAuthHeader(token)`**：设置或清除 `Authorization`；登录/拉取 profile 后需调用。
- **`getDeviceId()`**：写入请求头 `X-Device-Id`；结果 **模块级缓存**，避免每个请求读 `localStorage`。
- **响应拦截器**：把后端错误信息统一成 `Error` 抛出。

### 4.2 开发代理

见根目录 **`vite.config.ts`**：`/api`、`/uploads` 代理到 `VITE_API_PROXY_TARGET` 或本机后端端口。

### 4.3 类型约定

接口 JSON 常用形状：`ApiResp<T> = { success, code, message?, data? }`（见 `client.ts`）。

---

## 5. 已实现的关键性能/模式（对齐 Vercel React 实践思路）

| 主题 | 位置 | 要点 |
|------|------|------|
| 路由级代码分割 | `App.tsx` | `React.lazy` + `Suspense` |
| TabBar 稳定引用 | `ShellLayout.tsx` | 图标与 `SHELL_TABS` 在模块顶层创建 |
| 并行请求 | `pages/user-profile/index.tsx` | `Promise.all` 拉四类数据；`cancelled` 防竞态 |
| 默认 Tab | `pages/user-profile/index.tsx` | 数据到齐后一次 `setTab`，不用单独 effect 推导 |
| 长按稳定回调 | `useLongPress.ts` | `onLongPressRef` + `useMemo` 返回稳定 handlers |
| Feed 缓存与无限滚动 | `pages/home/index.tsx` | `useInfiniteQuery`，`queryKey: ['feed']` |

其他页面仍多为 **`api` + `useState`**；新功能若读多写少，优先 **`useQuery` / `useInfiniteQuery`** 与现有 `FEED_QUERY_KEY` 风格保持一致。

---

## 6. 样式（`*.module.less`）

- 页面在 **`pages/<kebab-case>/`** 下（与路由语义接近，如 `home`、`user-profile`、`post-detail`）：`index.tsx` + 可选 **`index.module.less`**。
- **全局 Less 变量**：`src/styles/tokens.less`（如 `@desk-color-primary`、`@desk-radius-card`）。由 `vite.config.ts` 里 `css.preprocessorOptions.less.additionalData` 注入到每个 `*.module.less`，**不要**在 `tokens.less` 里写会污染全局的裸选择器。
- 与 **antd-mobile** 组件混用时：组件若支持 `className`（如 `Card`、`Tag`），优先用模块类；仅个别动态值可保留行内 `style`。
- 全局页面底色等仍在 **`src/index.css`**（非 module）。
- **屏幕适配**：[postcss.config.mjs](postcss.config.mjs) 使用 `postcss-px-to-viewport`（基准宽 **375**，与 antd-mobile 常见稿一致），**仅转换 `src` 下样式**（`exclude: node_modules`），组件库仍为 px。圆形角请用 **`50%`** 或足够小的 px，避免 `999px` 被换算成超大 `vw`。
- **大屏**：`index.css` 在 `@media (min-width: 480px)` 内限制 `#root` 最大宽度并居中；该段内 px **不**参与 vw 转换（`mediaQuery: false`）。
- **安全区**：`ShellLayout` 内 `TabBar` 已开启 **`safeArea`**，适配刘海屏底部手势条。

## 7. 可复用组件（`src/components`）

| 路径 | 用途 |
|------|------|
| `components/PageCenterLoading/` | 居中 `DotLoading`：`App` Suspense fallback、`RequireAuth` loading |
| `components/MediaCard/` | 双列网格「图 + 标题 + 可选脚注」：个人主页 Tab、系列详情帖子列表等 |

此前以 **页面驱动 + 行内 style** 为主，并不是「没有可复用 UI」，而是 MVP 阶段未抽组件；后续重复块可继续下沉到 `components/`。

## 8. 目录速查

| 路径 | 用途 |
|------|------|
| `src/App.tsx` | 路由表、懒加载、Suspense |
| `src/main.tsx` | 入口、QueryClient、antd 语言包 |
| `src/layouts/ShellLayout.tsx` | 底 Tab + `Outlet` |
| `src/auth/AuthContext.tsx` / `RequireAuth.tsx` | 登录态与路由守卫 |
| `src/api/client.ts` | HTTP 客户端与拦截器 |
| `src/pages/<kebab-name>/index.tsx` | 各页面入口（同目录 `index.module.less`；懒加载如 `import('./pages/home')`、`import('./pages/user-profile')`） |
| `src/hooks/useLongPress.ts` | 首页标题长按切换布局等 |
| `src/components/*` | 跨页面复用的展示组件 |

---

## 9. 给 AI 的执行建议

1. 改路由时同时检查：**是否在 `ShellLayout` 子树**、是否需要 **`RequireAuth`**、懒加载 chunk 是否在 **`App` 的 `Suspense`** 内。
2. 改 Feed 或首页刷新逻辑时：全局搜索 **`FEED_QUERY_KEY`** 与 **`desk:home-refresh`**，保持行为一致。
3. 改鉴权时：同步检查 **`setAuthHeader`**、`desk_at` / `desk_rt`、`GET /me`。
4. 新增大量列表页时：考虑 **`useQuery`** 与 **`staleTime`**，避免重复请求。
5. 新页面：新建 **`pages/<kebab-name>/index.tsx`**（及可选 **`index.module.less`**），在 `App.tsx` 增加对应 `lazy(() => import('./pages/...'))`，优先使用 **`tokens.less`** 里的变量。

---

## 10. 与本文件对应的源码注释

以下文件在关键步骤处增加了 **块注释 / 行注释**（中文），便于与本文交叉阅读：

- `src/main.tsx`、`src/App.tsx`
- `src/layouts/ShellLayout.tsx`
- `src/auth/AuthContext.tsx`、`src/auth/RequireAuth.tsx`
- `src/api/client.ts`
- `src/pages/home/index.tsx`、`src/pages/user-profile/index.tsx`
- `src/hooks/useLongPress.ts`

各页面目录下的 **`index.module.less`** 与 **`src/components/*`** 为样式与结构约定，修改时保持与 **§6、§7** 一致。

修改上述约定时，请 **同步更新本 MD**，避免人类与 AI 读到过期结构说明。
