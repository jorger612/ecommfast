import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/services/products.service';
import { ProductZoom } from '@/components/catalog/ProductZoom';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { useCartStore } from '@/store/cart.store';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsService.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-text-muted">
        Producto no encontrado.
      </div>
    );
  }

  const inStock = product.stock > 0;

  const handleAddToCart = () => {
    addItem(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price: parseFloat(product.price),
        stock: product.stock,
        photo: product.photos[0] ?? '',
      },
      quantity,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Zoom viewer */}
        <ProductZoom photos={product.photos} productName={product.name} />

        {/* Product info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-text">{product.name}</h1>
            <p className="text-text-muted mt-1 text-sm">Ref: {product.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <p className="text-4xl font-bold text-primary">
            ${parseFloat(product.price).toFixed(2)}
          </p>

          {inStock
            ? <span className="badge-stock-ok">En stock ({product.stock} disponibles)</span>
            : <span className="badge-stock-out">Agotado</span>
          }

          {product.description && (
            <p className="text-text-muted leading-relaxed">{product.description}</p>
          )}

          {/* Quantity selector — solo visible si hay stock */}
          {inStock && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text">Cantidad</label>
              <QuantitySelector
                value={quantity}
                max={product.stock}
                onChange={setQuantity}
              />
            </div>
          )}

          {/* Subtotal preview */}
          {inStock && quantity > 1 && (
            <p className="text-sm text-text-muted">
              Subtotal:{' '}
              <span className="font-semibold text-text">
                ${(parseFloat(product.price) * quantity).toFixed(2)}
              </span>
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              className={`btn-primary flex-1 py-3 text-base transition-all ${
                added ? 'bg-accent hover:bg-accent' : ''
              }`}
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              {added ? '✓ Agregado al carrito' : inStock ? 'Agregar al carrito' : 'Sin stock'}
            </button>

            {added && (
              <Link to="/cart" className="btn-secondary py-3 px-4 text-sm whitespace-nowrap">
                Ver carrito
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
