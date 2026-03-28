import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { PaymentAdminPanel } from '@/components/admin/PaymentAdminPanel';
import ProductsAdminPanel from '@/components/admin/ProductsAdminPanel';
import CategoriesAdminPanel from '@/components/admin/CategoriesAdminPanel';
import BannersAdminPanel from '@/components/admin/BannersAdminPanel';
import InventoryAdminPanel from '@/components/admin/InventoryAdminPanel';

const NAV_ITEMS = [
  { to: '/admin/products',          label: 'Productos',      icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11" />
    </svg>
  )},
  { to: '/admin/categories',        label: 'Categorías',     icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  )},
  { to: '/admin/banners',           label: 'Banners',        icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )},
  { to: '/admin/inventory',         label: 'Inventario',     icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )},
  { to: '/admin/payment-providers', label: 'Medios de Pago', icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )},
  { to: '/admin/returns',           label: 'Devoluciones',   icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  )},
];

export function AdminDashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-white shadow-sm'
        : 'text-text hover:bg-surface'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-6">
      {/* Sidebar */}
      <aside className="w-52 flex-none">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">
          Administración
        </p>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:bg-red-50 hover:text-danger transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="products"          element={<ProductsAdminPanel />} />
          <Route path="categories"        element={<CategoriesAdminPanel />} />
          <Route path="banners"           element={<BannersAdminPanel />} />
          <Route path="inventory"         element={<InventoryAdminPanel />} />
          <Route path="payment-providers" element={<PaymentAdminPanel />} />
          <Route index element={
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <p className="text-text-muted">Selecciona una sección del menú.</p>
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}
