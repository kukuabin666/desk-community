/**
 * 应用路由入口（与 main.tsx 衔接见 ../AI_ONBOARDING.md）
 *
 * 1) 页面均为 React.lazy：按路由拆 chunk，减小首包（需配合外层 Suspense）。
 * 2) ShellLayout 只包住底部 Tab 四栏 + 发布；登录/详情等路由在壳外，无 TabBar。
 * 3) RequireAuth：未登录跳转 /login，子组件在通过校验后才挂载（含懒加载 chunk）。
 *
 * 路由表见 ./routes/routeConfig.ts；懒加载注册见 ./routes/pages.ts。
 * 维护路由时的常见坑已写在上述两个文件及 `./routes/AppRoutes.tsx`、`layouts/ShellLayout.tsx` 的文件头注释里。
 */
import { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { PageCenterLoading } from './components/PageCenterLoading';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageCenterLoading />}>
          <AppRoutes />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
