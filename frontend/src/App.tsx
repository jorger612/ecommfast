import { Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HomePage } from '@/pages/HomePage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { CartPage } from '@/pages/CartPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/"                  element={<HomePage />} />
          <Route path="/products/:slug"    element={<ProductDetailPage />} />
          <Route path="/cart"              element={<CartPage />} />
          <Route path="/admin/*"           element={<AdminDashboardPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
