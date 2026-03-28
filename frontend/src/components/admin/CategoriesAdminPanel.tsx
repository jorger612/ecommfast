import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminCategoriesService,
  type Category,
  type CategoryPayload,
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

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  slug: string;
  parent_id: string;
  is_active: boolean;
  sort_order: string;
}

const defaultForm = (): FormState => ({
  name: '',
  slug: '',
  parent_id: '',
  is_active: true,
  sort_order: '0',
});

const categoryToForm = (c: Category): FormState => ({
  name: c.name,
  slug: c.slug,
  parent_id: c.parent_id ?? '',
  is_active: c.is_active,
  sort_order: String(c.sort_order),
});

// ─── Component ────────────────────────────────────────────────────────────────

const CategoriesAdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast, showToast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminCategoriesService.list,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && form.name) {
      setForm((prev) => ({ ...prev, slug: toSlug(form.name) }));
    }
  }, [form.name, slugManuallyEdited]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => adminCategoriesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setFormOpen(false);
      showToast({ message: 'Categoría creada correctamente', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al crear la categoría', type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CategoryPayload> }) =>
      adminCategoriesService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setFormOpen(false);
      showToast({ message: 'Categoría actualizada correctamente', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al actualizar la categoría', type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminCategoriesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setDeleteTarget(null);
      showToast({ message: 'Categoría eliminada', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al eliminar la categoría', type: 'error' }),
  });

  const openCreate = () => {
    setEditingCategory(null);
    setForm(defaultForm());
    setFormErrors({});
    setSlugManuallyEdited(false);
    setFormOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setForm(categoryToForm(cat));
    setFormErrors({});
    setSlugManuallyEdited(true);
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'El nombre es requerido';
    if (!form.slug.trim()) errors.slug = 'El slug es requerido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload: CategoryPayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
      parent_id: form.parent_id || null,
    };
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const flatCategories = flattenCategories(categories);

  const getParentName = (parentId: string | null): string => {
    if (!parentId) return '—';
    return flatCategories.find((c) => c.id === parentId)?.name ?? '—';
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <ToastDisplay toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#111827]">Categorías</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-[#4F46E5] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Categoría
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {['Nombre', 'Slug', 'Categoría Padre', 'Estado', 'Orden', 'Acciones'].map((col) => (
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
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : flatCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#6B7280]">
                  No hay categorías registradas
                </td>
              </tr>
            ) : (
              flatCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  {/* Nombre */}
                  <td className="px-4 py-3 text-sm font-medium text-[#111827]">{cat.name}</td>

                  {/* Slug */}
                  <td className="px-4 py-3 text-sm text-[#6B7280] font-mono">{cat.slug}</td>

                  {/* Categoría Padre */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{getParentName(cat.parent_id)}</td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-sm">
                    {cat.is_active ? (
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
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{cat.sort_order}</td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#4F46E5] hover:text-indigo-700"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cat)}
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

      {/* Category form modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingCategory ? 'Editar Categoría' : 'Añadir Categoría'}
        size="md"
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
              placeholder="Nombre de la categoría"
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
              placeholder="slug-de-la-categoria"
            />
            {formErrors.slug && <p className="mt-1 text-xs text-red-500">{formErrors.slug}</p>}
          </div>

          {/* Categoría Padre */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">Categoría Padre</label>
            <select
              value={form.parent_id}
              onChange={(e) => setForm((prev) => ({ ...prev, parent_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
            >
              <option value="">Sin categoría padre</option>
              {flatCategories
                .filter((c) => c.id !== editingCategory?.id)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
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
                id="category-is-active"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-[#4F46E5]"
              />
              <label htmlFor="category-is-active" className="text-sm font-medium text-[#111827]">
                Activo
              </label>
            </div>
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
              {isMutating ? 'Guardando...' : editingCategory ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        message={`¿Deseas eliminar la categoría "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default CategoriesAdminPanel;
