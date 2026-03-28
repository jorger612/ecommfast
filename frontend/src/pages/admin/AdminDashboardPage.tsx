import { Routes, Route, NavLink } from 'react-router-dom';
import { PaymentAdminPanel } from '@/components/admin/PaymentAdminPanel';

export function AdminDashboardPage() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-primary text-white' : 'text-text hover:bg-surface'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
      {/* Sidebar */}
      <aside className="w-52 flex-none">
        <nav className="space-y-1">
          <NavLink to="/admin/payment-providers" className={linkClass}>
            Medios de Pago
          </NavLink>
          <NavLink to="/admin/products" className={linkClass}>
            Productos
          </NavLink>
          <NavLink to="/admin/categories" className={linkClass}>
            Categorías
          </NavLink>
          <NavLink to="/admin/banners" className={linkClass}>
            Banners
          </NavLink>
          <NavLink to="/admin/inventory" className={linkClass}>
            Inventario
          </NavLink>
          <NavLink to="/admin/returns" className={linkClass}>
            Devoluciones
          </NavLink>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Routes>
          <Route path="payment-providers" element={<PaymentAdminPanel />} />
          <Route index element={
            <div className="text-text-muted text-center py-16">
              Selecciona una sección del menú.
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}
