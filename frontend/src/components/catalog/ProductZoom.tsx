import { useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

interface Props {
  photos: string[];
  productName: string;
}

export function ProductZoom({ photos, productName }: Props) {
  const [selected, setSelected] = useState(0);
  const cover = photos[selected] ?? 'https://placehold.co/600x600/f9fafb/6b7280?text=Sin+foto';

  return (
    <div className="flex flex-col gap-4">
      {/* Main zoomable image */}
      <div className="aspect-square rounded-2xl overflow-hidden border border-gray-100 bg-surface">
        <Zoom>
          <img
            src={cover}
            alt={productName}
            className="w-full h-full object-cover cursor-zoom-in"
          />
        </Zoom>
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-none
                ${selected === idx ? 'border-primary' : 'border-gray-100 hover:border-gray-300'}`}
            >
              <img src={photo} alt={`${productName} ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
