import pxToViewport from 'postcss-px-to-viewport';

/**
 * 移动端 H5 常见方案：以 375 逻辑宽为设计基准，将业务样式中的 px 转为 vw，随屏宽等比缩放。
 * - 排除 node_modules：antd-mobile 等组件库保持自身 px，避免与官方视觉不一致。
 * - mediaQuery: false：写在 @media 内的 px 不转换，用于大屏「手机框」等固定物理布局。
 */
export default {
  plugins: [
    pxToViewport({
      unitToConvert: 'px',
      viewportWidth: 375,
      unitPrecision: 5,
      propList: ['*'],
      viewportUnit: 'vw',
      fontViewportUnit: 'vw',
      selectorBlackList: [],
      minPixelValue: 1,
      mediaQuery: false,
      landscape: false,
      exclude: [/node_modules/i],
    }),
  ],
};
