import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    change?: string
    changeType?: 'up' | 'down' | 'neutral'
    color?: string
    bg?: string
    delay?: number
}

export function StatsCard({ title, value, icon: Icon, change, changeType = 'up', color = 'text-primary-400', bg = 'bg-primary-500/10', delay = 0 }: StatsCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay }} className="stat-card group cursor-default">
            <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl transition-colors', bg)}>
                    <Icon size={18} className={color} />
                </div>
                {change && (
                    <span className={cn('text-xs flex items-center gap-0.5 font-medium',
                        changeType === 'up' ? 'text-green-400' : changeType === 'down' ? 'text-red-400' : 'text-gray-400')}>
                        {changeType === 'up' ? <ArrowUpRight size={12} /> : changeType === 'down' ? <ArrowDownRight size={12} /> : null}
                        {change}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-white mb-1">{value}</p>
            <p className="text-xs text-gray-400">{title}</p>
        </motion.div>
    )
}
