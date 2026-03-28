import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { LoginPage } from '@/pages/LoginPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Auth — no header/footer */}
      <Route path="/login" element={<LoginPage />} />

      {/* Public + protected routes share the shell */}
      <Route path="*" element={
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/"               element={<HomePage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/cart"           element={<CartPage />} />
              <Route path="/admin/*"        element={
                <RequireAuth>
                  <AdminDashboardPage />
                </RequireAuth>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      } />
    </Routes>
  );
}
