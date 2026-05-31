import { Flame, Zap, Snowflake } from 'lucide-react'
import { cn } from '@/utils/cn'

interface Props { score: string | undefined; showLabel?: boolean }

export function LeadScoreBadge({ score, showLabel = true }: Props) {
    if (!score) return null

    const config: Record<string, { icon: typeof Flame; color: string; bg: string; label: string }> = {
        HOT:  { icon: Flame,     color: 'text-red-400',   bg: 'bg-red-500/15 border-red-500/30',   label: 'Hot'  },
        WARM: { icon: Zap,       color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', label: 'Warm' },
        COLD: { icon: Snowflake, color: 'text-blue-400',  bg: 'bg-blue-500/15 border-blue-500/30',  label: 'Cold' },
    }
    const c = config[score]
    if (!c) return null

    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border', c.bg, c.color)}>
            <c.icon size={11} />
            {showLabel && c.label}
        </span>
    )
}
