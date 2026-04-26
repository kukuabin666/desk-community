/**
 * 路由守卫：AuthProvider.loading 时只显示 loading；无 token 跳转 /login 并带上 from 路径。
 * 注意：懒加载页面在通过校验后才挂载，首屏仍受 App.tsx 外层 Suspense 约束。
 */
import { Navigate, useLocation } from 'react-router-dom';
import { PageCenterLoading } from '../components/PageCenterLoading';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return <PageCenterLoading />;
  }
  if (!token) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
