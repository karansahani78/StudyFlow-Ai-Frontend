import { cn } from '@/utils/cn'

const VARIANTS: Record<string, string> = {
  HOT:                    'bg-red-500/20 text-red-400 border-red-500/30',
  WARM:                   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  COLD:                   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ACTIVE:                 'bg-green-500/20 text-green-400 border-green-500/30',
  INACTIVE:               'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SUSPENDED:              'bg-red-500/20 text-red-400 border-red-500/30',
  PENDING_VERIFICATION:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  NEW_INQUIRY:            'bg-violet-500/20 text-violet-400 border-violet-500/30',
  CONTACTED:              'bg-blue-500/20 text-blue-400 border-blue-500/30',
  QUALIFIED:              'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  COUNSELING_SCHEDULED:   'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  DOCUMENTATION:          'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  UNIVERSITY_APPLIED:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  OFFER_LETTER:           'bg-teal-500/20 text-teal-400 border-teal-500/30',
  VISA_PROCESSING:        'bg-purple-500/20 text-purple-400 border-purple-500/30',
  VISA_APPROVED:          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  CONVERTED:              'bg-green-500/20 text-green-400 border-green-500/30',
  LOST:                   'bg-red-500/20 text-red-400 border-red-500/30',
  PENDING:                'bg-amber-500/20 text-amber-400 border-amber-500/30',
  OVERDUE:                'bg-red-500/20 text-red-400 border-red-500/30',
  COMPLETED:              'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED:              'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SCHEDULED:              'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONFIRMED:              'bg-green-500/20 text-green-400 border-green-500/30',
  NO_SHOW:                'bg-red-500/20 text-red-400 border-red-500/30',
  UPLOADED:               'bg-sky-500/20 text-sky-400 border-sky-500/30',
  UNDER_REVIEW:           'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  APPROVED:               'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED:               'bg-red-500/20 text-red-400 border-red-500/30',
  EXPIRED:                'bg-gray-500/20 text-gray-400 border-gray-500/30',
  DRAFT:                  'bg-gray-500/20 text-gray-400 border-gray-500/30',
  SENT:                   'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PAID:                   'bg-green-500/20 text-green-400 border-green-500/30',
  OWNER:                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ADMIN:                  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  COUNSELOR:              'bg-primary-500/20 text-primary-400 border-primary-500/30',
  DOCUMENT_OFFICER:       'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  FINANCE_STAFF:          'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  MARKETING_TEAM:         'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export function Badge({ value, className }: { value: string; className?: string }) {
  const style = VARIANTS[value] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap', style, className)}>
      {value.replace(/_/g, ' ')}
    </span>
  )
}
