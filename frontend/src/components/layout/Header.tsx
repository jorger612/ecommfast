import { Link } from 'react-router-dom';
import { CategoryTree } from '@/components/catalog/CategoryTree';
import { useCartStore } from '@/store/cart.store';

export function Header() {
  const totalItems = useCartStore((s) => s.totalItems());
  return (
    <header className="bg-card border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary tracking-tight">
              Ecomm<span className="text-secondary">Fast</span>
            </span>
          </Link>

          {/* Category nav */}
          <nav className="hidden md:flex items-center gap-1">
            <CategoryTree />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs font-bold
                                 w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <Link to="/admin" className="btn-secondary text-sm">Admin</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
