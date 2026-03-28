import { Link } from 'react-router-dom';
import { useCartStore } from '@/store/cart.store';
import { QuantitySelector } from '@/components/ui/QuantitySelector';

export function CartPage() {
  const { items, updateQuantity, removeItem, total, totalItems } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-semibold text-text mb-2">Tu carrito está vacío</h1>
        <p className="text-text-muted mb-8">Agrega productos desde el catálogo para comenzar.</p>
        <Link to="/" className="btn-primary">Ver productos</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-semibold text-text mb-8">
        Tu carrito <span className="text-text-muted font-normal text-lg">({totalItems()} artículo{totalItems() !== 1 ? 's' : ''})</span>
      </h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.product_id} className="card p-4 flex gap-4 items-start">
            {/* Foto */}
            <Link to={`/products/${item.slug}`} className="flex-none">
              <img
                src={item.photo || 'https://placehold.co/80x80/f9fafb/6b7280?text=?'}
                alt={item.name}
                className="w-20 h-20 object-cover rounded-lg bg-surface"
              />
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                to={`/products/${item.slug}`}
                className="font-semibold text-text hover:text-primary transition-colors line-clamp-2"
              >
                {item.name}
              </Link>
              <p className="text-primary font-bold text-lg mt-1">
                ${item.price.toFixed(2)}
              </p>

              <div className="mt-3">
                <QuantitySelector
                  value={item.quantity}
                  max={item.stock}
                  onChange={(q) => updateQuantity(item.product_id, q)}
                />
              </div>
            </div>

            {/* Subtotal + eliminar */}
            <div className="flex-none text-right space-y-2">
              <p className="font-bold text-text">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-danger text-sm hover:underline"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="mt-8 card p-6 max-w-sm ml-auto space-y-4">
        <div className="flex justify-between text-text-muted text-sm">
          <span>Subtotal ({totalItems()} artículos)</span>
          <span>${total().toFixed(2)}</span>
        </div>
        <div className="border-t border-gray-100 pt-4 flex justify-between font-bold text-text text-lg">
          <span>Total</span>
          <span>${total().toFixed(2)}</span>
        </div>
        <button className="btn-primary w-full py-3 text-base">
          Proceder al pago
        </button>
        <Link to="/" className="btn-secondary w-full py-2 text-sm text-center block">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
