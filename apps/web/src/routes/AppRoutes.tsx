/**
 * 由 `routeConfig` 生成 `<Routes>`。
 *
 * 坑：`path: '*'` 必须在整棵路由树的**最后**声明（本文件里即排在 `ShellLayout` 包裹段之后）。
 * 若把 `*` 与普通 `layout: 'root'` 一起提前渲染，`/`、`/home` 等会先命中通配，壳内路由永远不生效。
 */
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from '../auth/RequireAuth';
import { ShellLayout } from '../layouts/ShellLayout';
import { Pages, type PageKey } from './pages';
import { APP_ROUTES } from './routeConfig';

function PageElement({ page, auth }: { page: PageKey; auth?: boolean }) {
  const Comp = Pages[page];
  if (auth) {
    return (
      <RequireAuth>
        <Comp />
      </RequireAuth>
    );
  }
  return <Comp />;
}

function routeElement(def: (typeof APP_ROUTES)[number]) {
  if ('redirectTo' in def) {
    return <Navigate to={def.redirectTo} replace />;
  }
  return <PageElement page={def.page} auth={def.auth} />;
}

export function AppRoutes() {
  const rootRoutes = APP_ROUTES.filter(r => r.layout === 'root' && r.path !== '*');
  const shellRoutes = APP_ROUTES.filter(r => r.layout === 'shell');
  const fallback = APP_ROUTES.find(r => r.path === '*');

  return (
    <Routes>
      {rootRoutes.map(def => (
        <Route key={def.path} path={def.path} element={routeElement(def)} />
      ))}
      <Route element={<ShellLayout />}>
        {shellRoutes.map(def => (
          <Route key={def.path} path={def.path} element={routeElement(def)} />
        ))}
      </Route>
      {fallback ? (
        <Route key="*" path="*" element={routeElement(fallback)} />
      ) : null}
    </Routes>
  );
}
