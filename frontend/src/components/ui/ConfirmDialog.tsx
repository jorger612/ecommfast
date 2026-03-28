import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onCancel,
  message = 'Esta acción no se puede deshacer. ¿Deseas continuar?',
  loading = false,
}) => {
  return (
    <Modal open={open} onClose={onCancel} title="Confirmar eliminación" size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <svg
          className="w-12 h-12 text-[#EF4444] mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-[#EF4444] hover:bg-red-600 text-white rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
