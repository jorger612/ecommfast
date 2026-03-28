import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useQuery } from '@tanstack/react-query';
import { bannersService, type Banner } from '@/services/products.service';
import { Link } from 'react-router-dom';

export function BannerSlider() {
  const { data: banners = [] } = useQuery({
    queryKey: ['banners'],
    queryFn: bannersService.list,
    staleTime: 5 * 60_000,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false }, [
    Autoplay({ delay: 5000, stopOnInteraction: false }),
  ]);

  if (banners.length === 0) return null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-card">
      {/* Embla viewport — ref va aquí, NO en el wrapper externo */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <BannerSlide key={banner.id} banner={banner} />
          ))}
        </div>
      </div>

      {/* Dot navigation — dentro del wrapper externo para posicionamiento absoluto */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => emblaApi?.scrollTo(idx)}
            className="w-2 h-2 rounded-full bg-white/60 hover:bg-white transition-colors"
            aria-label={`Banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function BannerSlide({ banner }: { banner: Banner }) {
  const content = (
    <div
      className="relative aspect-[16/5] bg-surface"
      style={{ flex: '0 0 100%', minWidth: '0' }}
    >
      <img
        src={banner.image_url}
        alt={banner.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex items-end pb-8 px-10">
        <h2 className="text-white text-xl sm:text-3xl font-bold leading-tight"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
          {banner.title}
        </h2>
      </div>
    </div>
  );

  return banner.link_url
    ? <Link to={banner.link_url}>{content}</Link>
    : <>{content}</>;
}
