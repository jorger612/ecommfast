import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminBannersService,
  type Banner,
  type BannerPayload,
} from '@/services/products.service';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast, ToastDisplay } from '@/components/ui/Toast';

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  image_url: string;
  link_url: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sort_order: string;
}

const defaultForm = (): FormState => ({
  title: '',
  image_url: '',
  link_url: '',
  start_date: '',
  end_date: '',
  is_active: true,
  sort_order: '0',
});

const bannerToForm = (b: Banner): FormState => ({
  title: b.title,
  image_url: b.image_url,
  link_url: b.link_url ?? '',
  start_date: b.start_date ? b.start_date.slice(0, 10) : '',
  end_date: b.end_date ? b.end_date.slice(0, 10) : '',
  is_active: b.is_active,
  sort_order: String(b.sort_order),
});

// ─── Component ────────────────────────────────────────────────────────────────

const BannersAdminPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast, showToast } = useToast();

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: adminBannersService.list,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: BannerPayload) => adminBannersService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setFormOpen(false);
      showToast({ message: 'Banner creado correctamente', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al crear el banner', type: 'error' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BannerPayload> }) =>
      adminBannersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setFormOpen(false);
      showToast({ message: 'Banner actualizado correctamente', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al actualizar el banner', type: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminBannersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      setDeleteTarget(null);
      showToast({ message: 'Banner eliminado', type: 'success' });
    },
    onError: () => showToast({ message: 'Error al eliminar el banner', type: 'error' }),
  });

  const openCreate = () => {
    setEditingBanner(null);
    setForm(defaultForm());
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setForm(bannerToForm(banner));
    setFormErrors({});
    setFormOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'El título es requerido';
    if (!form.image_url.trim()) errors.image_url = 'La URL de imagen es requerida';
    if (!form.start_date) errors.start_date = 'La fecha de inicio es requerida';
    if (!form.end_date) errors.end_date = 'La fecha de fin es requerida';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const payload: BannerPayload = {
      title: form.title.trim(),
      image_url: form.image_url.trim(),
      link_url: form.link_url.trim() || undefined,
      start_date: form.start_date,
      end_date: form.end_date,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    if (editingBanner) {
      updateMutation.mutate({ id: editingBanner.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <ToastDisplay toast={toast} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#111827]">Banners</h2>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 bg-[#4F46E5] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir Banner
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-[#F9FAFB]">
              {['Imagen', 'Título', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Orden', 'Acciones'].map((col) => (
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
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#6B7280]">
                  No hay banners registrados
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50 transition-colors">
                  {/* Imagen */}
                  <td className="px-4 py-3 text-sm">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-20 h-7 object-cover rounded cursor-pointer hover:ring-2 hover:ring-[#4F46E5]"
                        onClick={() => setZoomUrl(banner.image_url)}
                      />
                    ) : (
                      <div className="w-20 h-7 bg-gray-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>

                  {/* Título */}
                  <td className="px-4 py-3 text-sm font-medium text-[#111827] max-w-[200px] truncate">
                    {banner.title}
                  </td>

                  {/* Fecha Inicio */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {banner.start_date ? new Date(banner.start_date).toLocaleDateString() : '—'}
                  </td>

                  {/* Fecha Fin */}
                  <td className="px-4 py-3 text-sm text-[#6B7280]">
                    {banner.end_date ? new Date(banner.end_date).toLocaleDateString() : '—'}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3 text-sm">
                    {banner.is_active ? (
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
                  <td className="px-4 py-3 text-sm text-[#6B7280]">{banner.sort_order}</td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(banner)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-[#4F46E5] hover:text-indigo-700"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(banner)}
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

      {/* Banner form modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBanner ? 'Editar Banner' : 'Añadir Banner'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              placeholder="Título del banner"
            />
            {formErrors.title && <p className="mt-1 text-xs text-red-500">{formErrors.title}</p>}
          </div>

          {/* URL Imagen */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">
              URL Imagen <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={form.image_url}
              onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              placeholder="https://..."
            />
            {formErrors.image_url && <p className="mt-1 text-xs text-red-500">{formErrors.image_url}</p>}
          </div>

          {/* URL Enlace */}
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1">URL Enlace (opcional)</label>
            <input
              type="url"
              value={form.link_url}
              onChange={(e) => setForm((prev) => ({ ...prev, link_url: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              placeholder="https://..."
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Fecha Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              />
              {formErrors.start_date && <p className="mt-1 text-xs text-red-500">{formErrors.start_date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111827] mb-1">
                Fecha Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/40 focus:border-[#4F46E5]"
              />
              {formErrors.end_date && <p className="mt-1 text-xs text-red-500">{formErrors.end_date}</p>}
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
                id="banner-is-active"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded accent-[#4F46E5]"
              />
              <label htmlFor="banner-is-active" className="text-sm font-medium text-[#111827]">
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
              {isMutating ? 'Guardando...' : editingBanner ? 'Guardar cambios' : 'Crear banner'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        message={`¿Deseas eliminar el banner "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default BannersAdminPanel;
