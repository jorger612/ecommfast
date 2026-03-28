import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { productsService } from '@/services/products.service';
import { BannerSlider } from '@/components/catalog/BannerSlider';
import { ProductCarousel } from '@/components/catalog/ProductCarousel';
import { CategoryTree } from '@/components/catalog/CategoryTree';

export function HomePage() {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('category_slug') ?? undefined;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', categorySlug],
    queryFn: () => productsService.list({ category_slug: categorySlug }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hero banners */}
      <BannerSlider />

      {/* Mobile category nav */}
      <nav className="md:hidden">
        <CategoryTree />
      </nav>

      {/* Product carousel */}
      <section>
        <h2 className="text-xl font-semibold text-text mb-4">
          {categorySlug ? `Categoría: ${categorySlug}` : 'Todos los productos'}
        </h2>

        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-none w-64 h-80 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <ProductCarousel products={products} />
        )}

        {!isLoading && products.length === 0 && (
          <p className="text-text-muted text-center py-16">No se encontraron productos en esta categoría.</p>
        )}
      </section>
    </div>
  );
}
