import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * 将 `pages/*` 的**具名导出**包成 `React.lazy` 需要的 default。
 * `exportName` 必须与对应 `index.tsx` 里的导出同名；否则运行时报错，构建期不一定能发现。
 */
export function lazyNamed<M extends Record<string, ComponentType>>(
  importer: () => Promise<M>,
  exportName: keyof M & string
): LazyExoticComponent<ComponentType> {
  return lazy(() =>
    importer().then(m => ({
      default: m[exportName] as ComponentType,
    }))
  );
}
