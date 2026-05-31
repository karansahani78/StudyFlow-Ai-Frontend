import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
    icon: LucideIcon
    title: string
    description?: string
    action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <Icon size={28} className="text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-300 mb-2">{title}</h3>
            {description && <p className="text-sm text-gray-500 max-w-sm">{description}</p>}
            {action && (
                <button onClick={action.onClick} className="btn-primary mt-5">
                    {action.label}
                </button>
            )}
        </motion.div>
    )
}
