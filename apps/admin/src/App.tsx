import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProductManagePage } from './pages/ProductManagePage';
import { TOKEN_KEY } from './auth/storage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const t = localStorage.getItem(TOKEN_KEY);
  if (!t) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/products"
        element={
          <RequireAuth>
            <ProductManagePage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<Navigate to="/products" replace />} />
      <Route path="*" element={<Navigate to="/products" replace />} />
    </Routes>
  );
}
