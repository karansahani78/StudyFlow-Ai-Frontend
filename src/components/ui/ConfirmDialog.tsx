import { Modal } from './Modal'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmLabel?: string
    loading?: boolean
    danger?: boolean
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel='Confirm', loading=false, danger=false }: Props) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="space-y-4">
                <div className="flex gap-3">
                    <div className={`p-2.5 rounded-xl flex-shrink-0 ${danger ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                        <AlertTriangle size={18} className={danger ? 'text-red-400' : 'text-amber-400'} />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
                    <button onClick={onConfirm} disabled={loading}
                        className={`flex-1 justify-center flex items-center gap-2 font-medium px-4 py-2 rounded-xl transition-all ${danger ? 'btn-danger' : 'btn-primary'}`}>
                        {loading ? <Loader2 size={16} className="animate-spin" /> : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
