import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  if (!open) return null;

  const btnColor =
    variant === 'danger'
      ? 'bg-error hover:bg-error/80'
      : 'bg-warning hover:bg-warning/80';

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative glass rounded-2xl p-6 w-full max-w-md animate-scale-in shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              variant === 'danger' ? 'bg-error/15 text-error' : 'bg-warning/15 text-warning'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            id="confirm-modal-cancel"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            id="confirm-modal-confirm"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${btnColor}`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
