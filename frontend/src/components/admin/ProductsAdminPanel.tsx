import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminProductsService,
  adminCategoriesService,
  type Product,
  type Category,
  type ProductPayload,
} from '@/services/products.service';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast, ToastDisplay } from '@/components/ui/Toast';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: string;
  stock: string;
  is_active: boolean;
  sort_order: string;
  photos: string[];
}

const defaultForm = (): FormState => ({
  name: '',
  slug: '',
  category_id: '',
  description: '',
  price: '',
  stock: '0',
  is_active: true,
  sort_order: '0',
  photos: [''],
});

const productToForm = (p: Product): FormState => ({
  name: p.name,
  slug: p.slug,
  category_id: p.category_id,
  description: p.description ?? '',
  price: p.price,
  stock: String(p.stock),
  is_active: p.is_active,
  sort_order: String(p.sort_order),
  photos: p.photos.length > 0 ? p.photos : [''],
});

// ─── Component ────────────────────────────────────────────────────────────────

const ProductsAdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast, showToast } = useToast();

  // Queries
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: adminProductsService.list,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminCategoriesService.list,
  });

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Image zoom modal
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && form.name) {
      setForm((prev) => ({ ...prev, slug: toSlug(form.name) }));
    }
  }, [form.name, slugManuallyEdited]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: ProductPayload) => adminProductsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setFormOpen(false);
      showToast({ message: 'Producto creado correctamente', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al crear el producto', type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductPayload> }) =>
      adminProductsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setFormOpen(false);
      showToast({ message: 'Producto actualizado correctamente', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al actualizar el producto', type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminProductsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      setDeleteTarget(null);
      showToast({ message: 'Producto eliminado', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al eliminar el producto', type: 'error' }),
  });

  // Handlers
  const openCreate = () => {
    setEditingProduct(null);
    setForm(defaultForm());
    setFormErrors({});
    setSlugManuallyEdited(false);
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm(productToForm(product));
    setFormErrors({});
    setSlugManuallyEdited(true);
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'El nombre es requerido';
    if (!form.slug.trim()) errors.slug = 'El slug es requerido';
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) errors.price = 'El precio debe ser mayor a 0';
    const stockNum = parseInt(form.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) errors.stock = 'El stock debe ser >= 0';
    const validPhotos = form.photos.filter((p) => p.trim() !== '');
    if (validPhotos.length === 0) errors.photos = 'Debe incluir al menos una URL de foto';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload: ProductPayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      category_id: form.category_id,
      description: form.description.trim() || undefined,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
      photos: form.photos.filter((p) => p.trim() !== ''),
    };
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handlePhotoChange = (index: number, value: string) => {
    const updated = [...form.photos];
    updated[index] = value;
    setForm((prev) => ({ ...prev, photos: updated }));
  };

  const addPhoto = () => {
    if (form.photos.length >= 5) return;
    setForm((prev) => ({ ...prev, photos: [...prev.photos, ''] }));
  };

  const removePhoto = (index: number) => {
    const updated = form.photos.filter((_, i) => i !== index);
    setForm((prev) => ({ ...prev, photos: updated.length > 0 ? updated : [''] }));
  };

  const getCategoryName = (categoryId: string): string => {
    const flat = flattenCategories(categories);
    return flat.find((c) => c.id === categoryId)?.name ?? '—';
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const traverse = (list: Category[]) => {
      list.forEach((c) => {
        result.push(c);
        if (c.children) traverse(c.children);
      });
    };
    traverse(cats);
    return result;
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ─── Render ─────────────────────────────────────────────────────────────────

  const flatCategories = flattenCategories(categories);

  return (
    <div>
      <ToastDisplay toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#111827]">Productos</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-[#4F46E5] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Producto
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {['Imágenes', 'Nombre', 'Precio', 'Stock', 'Categoría', 'Estado', 'Orden', 'Acciones'].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-[#6B7280]">
                  No hay productos registrados
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  {/* Imágenes */}
                  <td className="px-4 py-3 text-sm">
                    {product.photos.length > 0 ? (
                      <img
                        src={product.photos[0]}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-[#4F46E5]"
                        onClick={() => setZoomUrl(product.photos[0])}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>

                  {/* Nombre */}
                  <td className="px-4 py-3 text-sm font-medium text-[#111827] max-w-[180px] truncate">
                    {product.name}
                  </td>

                  {/* Precio */}
                  <td className="px-4 py-3 text-sm text-[#111827]">
                    ${parseFloat(product.price).toFixed(2)}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3 text-sm">
                    {product.stock > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {product.stock}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Sin stock
                      </span>
                    )}
                  </td>

                  {/* Categoría */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {getCategoryName(product.category_id)}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-sm">
                    {product.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Inactivo
                      </span>
                    )}
                  </td>

                  {/* Orden */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{product.sort_order}</td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#4F46E5] hover:text-indigo-700"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#EF4444] hover:text-red-600"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image zoom modal */}
      <Modal open={zoomUrl !== null} onClose={() => setZoomUrl(null)} title="Vista previa" size="sm">
        {zoomUrl && (
          <img src={zoomUrl} alt="Vista previa" className="max-h-96 w-full object-contain rounded-lg" />
        )}
      </Modal>

      {/* Product form modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingProduct ? 'Editar Producto' : 'Añadir Producto'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              placeholder="Nombre del producto"
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-500">{formErrors.name}</p>}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setForm((prev) => ({ ...prev, slug: e.target.value }));
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              placeholder="slug-del-producto"
            />
            {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Categoría</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
            >
              <option value="">Sin categoría</option>
              {flatCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5] resize-none"
              placeholder="Descripción del producto..."
            />
          </div>

          {/* Precio y Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
                placeholder="0.00"
              />
              {formErrors.price && <p className="mt-1 text-xs text-red-500">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Stock <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
                placeholder="0"
              />
              {formErrors.stock && <p className="mt-1 text-xs text-red-500">{formErrors.stock}</p>}
            </div>
          </div>

          {/* Orden y Estado */}
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">Orden</label>
              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => setForm((prev) => ({ ...prev, sort_order: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="product-is-active"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-[#4F46E5]"
              />
              <label htmlFor="product-is-active" className="text-sm font-medium text-[#111827]">
                Activo
              </label>
            </div>
          </div>

          {/* Fotos */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Fotos (URLs) <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {form.photos.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handlePhotoChange(index, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    disabled={form.photos.length === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-[#EF4444] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Eliminar foto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            {form.photos.length < 5 && (
              <button
                type="button"
                onClick={addPhoto}
                className="mt-2 inline-flex items-center gap-1 text-sm text-[#4F46E5] hover:text-indigo-700 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir foto
              </button>
            )}
            {formErrors.photos && <p className="mt-1 text-xs text-red-500">{formErrors.photos}</p>}
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-[#6B7280] hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isMutating}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-[#4F46E5] text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isMutating ? 'Guardando...' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        message={`¿Deseas eliminar el producto "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProductsAdminPanel;
