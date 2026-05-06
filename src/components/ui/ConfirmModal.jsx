import { AlertTriangle } from 'lucide-react'
import Button from './Button'

export default function ConfirmModal({ title, message, confirmLabel = 'Supprimer', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 shrink-0">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} type="button">Annuler</Button>
          <Button
            onClick={onConfirm}
            type="button"
            className="!bg-red-600 hover:!bg-red-700 focus:!ring-red-500"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
