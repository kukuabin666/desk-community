/**
 * Node 进程入口：加载已编译的 Midway 配置类（`src/configuration.ts` → `dist/configuration.js`）。
 * 开发时用 `midway-bin dev` 会先编译再跑；生产需先 `npm run build` 再 `node bootstrap.js`。
 */
const { Bootstrap } = require('@midwayjs/bootstrap');

Bootstrap.run({
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  module: require('./dist/configuration'),
  // compile to dist in dev midway-bin handles ts
});
