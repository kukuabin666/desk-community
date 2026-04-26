# desk-community

桌面/社区类产品的全栈单体仓库：**Midway（Koa）API** + **React 用户端（H5）** + **React 管理后台**，共享 `packages/shared` 类型与工具。

新人或 AI Agent 建议先读本文件，再按需深入各应用下的专项文档。

---

## 环境要求

- **Node.js**：建议 **20 LTS**（18+ 通常可用）
- **npm**：仓库使用 **npm workspaces**（勿混用 pnpm/yarn 除非你知道在做什么）

---

## 一分钟跑起来

```bash
git clone <repo-url> desk-community
cd desk-community
npm install
```

### 1. 环境变量

根目录 [`.env.example`](.env.example) 列出常用变量，请按下面方式落到各应用（Vite 只认各自目录下的 `.env`）：

| 文件 | 用途 |
|------|------|
| `apps/api/.env` | 后端：`API_PORT`、`JWT_SECRET`、`DATABASE_PATH`、`REDIS_URL` 等 |
| `apps/web/.env` | 用户端：`VITE_API_BASE`、`VITE_API_PROXY_TARGET`（开发代理到后端） |
| `apps/admin/.env` | 管理端：同上，代理到同一 API |

可从根目录复制示例后再改：

```bash
cp .env.example apps/api/.env
# 按需创建 apps/web/.env、apps/admin/.env（至少可设 VITE_API_PROXY_TARGET=http://127.0.0.1:7001）
```

更完整的说明见 [`apps/api/src/config/config.default.ts`](apps/api/src/config/config.default.ts) 内注释（含 `DESK_ADMIN_USERNAME`、`DESK_REQUIRE_DEVICE_VERIFY` 等）。

### 2. 启动命令（在仓库根目录执行）

| 命令 | 说明 |
|------|------|
| `npm run dev` | 并行启动 **API + 用户端 Web**（最常用） |
| `npm run dev:api` | 仅 API，默认端口 **7001** |
| `npm run dev:web` | 仅用户端，默认 **http://127.0.0.1:5173** |
| `npm run dev:admin` | API + 管理端，管理端默认 **http://127.0.0.1:5174** |
| `npm run dev:all` | API + Web + Admin 三者 |

生产构建：

```bash
npm run build
```

仅启动已构建的 API：`npm run start:api`（需先在 `apps/api` 完成 `npm run build`）。

---

## 仓库结构

```
desk-community/
├── apps/
│   ├── api/          # @desk/api — Midway 3 + TypeORM（sqljs 文件库）+ JWT
│   ├── web/          # @desk/web — Vite + React 18 移动端 H5（antd-mobile）
│   └── admin/        # @desk/admin — Vite + React 18 后台（antd）
├── packages/
│   └── shared/       # @desk/shared — 共享 TypeScript 包（当前应用未引用时可忽略；引用后需先 build）
└── package.json      # workspaces 与聚合脚本
```

### 默认端口速查

| 服务 | 端口 | 配置位置 |
|------|------|----------|
| API | 7001 | `API_PORT` / `apps/api` 配置 |
| Web | 5173 | `apps/web/vite.config.ts` |
| Admin | 5174 | `apps/admin/vite.config.ts` |

开发环境下，Web/Admin 将 `/api`、`/uploads` **代理**到 `VITE_API_PROXY_TARGET`（默认 `http://127.0.0.1:7001`）。

---

## 给开发者的延伸阅读

- **用户端前端（路由、鉴权、样式、API 约定）**：[apps/web/AI_ONBOARDING.md](apps/web/AI_ONBOARDING.md)
- **API 启动与请求时序（Midway / JWT / Controller）**：[apps/api/RUNTIME_SEQUENCE.md](apps/api/RUNTIME_SEQUENCE.md)

---

## 给 AI Agent 的简短指引

1. **改接口**：从 `apps/api/src/controller/` → `service/` → `entity/` 顺藤摸瓜；统一响应形态见 `apps/api/src/util/response.ts`。
2. **改用户端**：先读 [apps/web/AI_ONBOARDING.md](apps/web/AI_ONBOARDING.md)；路由与懒加载集中在 `apps/web/src/App.tsx`。
3. **鉴权**：Web 侧 token 与 `GET /me` 见 `apps/web/src/auth/`；API 侧 JWT 按路由挂载中间件（见 RUNTIME_SEQUENCE 文档）。
4. **数据库**：默认 sqljs 文件库，路径由 `DATABASE_PATH` 控制；本地数据目录在 `apps/api/data/`（与 `uploads/` 同级，具体以配置为准）。
5. **约定变更**：若改了目录结构或 env 含义，请同步更新本 README 与对应应用的 `*_ONBOARDING.md` / `RUNTIME_SEQUENCE.md`，避免文档漂移。
