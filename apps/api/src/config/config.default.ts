/**
 * 默认运行时配置（可被 `config.local.ts` 等覆盖）。
 * - `koa.port`：服务端口，可用环境变量 `API_PORT`。
 * - `typeorm`：默认 sqljs + 文件库，适合单机 demo；生产可换 MySQL 等。
 * - `jwt`：签发与校验密钥 `JWT_SECRET`；过期时间影响 Web 端 refresh 策略。
 * - `upload` / `staticFile`：上传临时目录与 `/uploads` 静态映射，需与 `configuration.onReady` 创建的目录一致。
 * - `crossDomain`：允许前端携带 Cookie/Authorization 及自定义头 `X-Device-Id`。
 *
 * 坑：`sqljs` 在 TypeORM 连接阶段就会读写 `location` 文件；目录若只在 `onReady` 里创建会太晚，
 * 出现 ENOENT。因此在加载本配置时同步创建 `data` / `uploads` 子目录（与 `configuration.ts` 一致，幂等）。
 */
import { MidwayConfig } from '@midwayjs/core';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ormEntities } from '../entity';

const dataDir = join(__dirname, '../../data');
const uploadDir = join(__dirname, '../../uploads');

// 确保 data/ 与 uploads/tmp、uploads/public 目录存在（TypeORM/sqljs & 上传/静态资源 依赖），避免 ENOENT 错误。
// 之所以在 config 阶段创建，是因为 sqljs 初始化时会直接读写 location 路径，若等到应用 onReady 再创建可能为时已晚。
for (const d of [dataDir, join(uploadDir, 'tmp'), join(uploadDir, 'public')]) {
  if (!existsSync(d)) mkdirSync(d, { recursive: true });
}

export default {
  keys: 'desk-community-keys',
  koa: {
    port: Number(process.env.API_PORT || 7001),
  },
  crossDomain: {
    allowCredentials: true,
    allowHeaders: 'Content-Type, Authorization, X-Device-Id',
  },
  typeorm: {
    dataSource: {
      default: {
        type: 'sqljs',
        autoSave: true,
        location: process.env.DATABASE_PATH || join(dataDir, 'desk.sqljs'),
        synchronize: true,
        logging: false,
        entities: ormEntities,
      },
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-me',
    expiresIn: '7d',
  },
  upload: {
    mode: 'file',
    fileSize: '10mb',
    whitelist: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    tmpdir: join(uploadDir, 'tmp'),
    cleanTimeout: 5 * 60 * 1000,
    match: /\/api\/common\/upload/,
  },
  staticFile: {
    dirs: {
      default: {
        prefix: '/uploads',
        dir: join(uploadDir, 'public'),
      },
    },
  },
  /**
   * App-specific（部分键由代码读 `process.env`，此处仅占位/文档）。
   * - `REDIS_URL` / `SMS_MOCK`：见 KvService、SmsService。
   * - **`DESK_ADMIN_USERNAME`**：启动种子阶段若库中已有该用户名，则将其 `role` 设为 `admin`（见 SeedService），管理端 `/api/admin/*` 需该角色；提权后请重新登录以签发含 `role` 的 JWT。
   * - **`DESK_REQUIRE_DEVICE_VERIFY=1`**：新设备登录须短信二次验证（`AuthService`）；不设则关闭，便于本地/联调。
   */
  desk: {
    redisUrl: process.env.REDIS_URL || '',
    smsMock: process.env.SMS_MOCK !== '0',
    requireDeviceVerify: process.env.DESK_REQUIRE_DEVICE_VERIFY === '1',
  },
} as MidwayConfig;
