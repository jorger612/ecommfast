import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { categoriesService, type Category } from '@/services/products.service';

export function CategoryTree() {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesService.list,
    staleTime: 5 * 60_000,
  });

  return (
    <ul className="flex items-center gap-1">
      {categories.map((cat) => (
        <CategoryItem key={cat.id} category={cat} />
      ))}
    </ul>
  );
}

function CategoryItem({ category }: { category: Category }) {
  const [open, setOpen] = useState(false);
  const hasChildren = (category.children?.length ?? 0) > 0;

  return (
    <li
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        to={`/?category_slug=${category.slug}`}
        className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-text hover:bg-surface transition-colors"
      >
        {category.name}
        {hasChildren && (
          <svg className="w-3 h-3 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </Link>

      {hasChildren && open && (
        <ul className="absolute top-full left-0 mt-1 bg-card border border-gray-100 rounded-xl shadow-card-hover py-1 min-w-[180px] z-50">
          {category.children!.map((child) => (
            <li key={child.id}>
              <Link
                to={`/?category_slug=${child.slug}`}
                className="block px-4 py-2 text-sm text-text hover:bg-surface transition-colors"
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
