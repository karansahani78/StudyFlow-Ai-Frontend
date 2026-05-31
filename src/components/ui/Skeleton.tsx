import { cn } from '@/utils/cn'

export function Skeleton({ className }: { className?: string }) {
    return <div className={cn('animate-pulse bg-white/8 rounded-lg', className)} />
}

export function CardSkeleton() {
    return (
        <div className="glass-card p-6 space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    )
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/8 flex gap-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-4 flex-1" />)}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 border-b border-white/5 flex gap-4 items-center">
                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                    {[1,2,3,4].map(j => <Skeleton key={j} className="h-4 flex-1" />)}
                </div>
            ))}
        </div>
    )
}
