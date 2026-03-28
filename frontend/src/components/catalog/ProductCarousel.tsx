import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Link } from 'react-router-dom';
import type { Product } from '@/services/products.service';

interface Props {
  products: Product[];
}

export function ProductCarousel({ products }: Props) {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 4000, stopOnInteraction: true }),
  ]);

  if (products.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl" ref={emblaRef}>
      <div className="flex gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-none w-64 sm:w-72"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: Product }) {
  const coverPhoto = product.photos[0] ?? 'https://placehold.co/400x400/f9fafb/6b7280?text=Sin+foto';
  const inStock = product.stock > 0;

  return (
    <Link to={`/products/${product.slug}`} className="card block overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-surface">
        <img
          src={coverPhoto}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="badge-stock-out">Agotado</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text text-sm truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-primary font-bold text-lg">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          {inStock
            ? <span className="badge-stock-ok">En stock</span>
            : <span className="badge-stock-out">Agotado</span>
          }
        </div>
      </div>
    </Link>
  );
}
