import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { leadsApi, usersApi } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Download, ChevronRight, Loader2, RefreshCw, Filter, X } from 'lucide-react'
import { fmtDate, fmtCurrency } from '@/utils/format'
import toast from 'react-hot-toast'
import type { Lead, Page, User } from '@/types'

const STAGES = ['NEW_INQUIRY','CONTACTED','QUALIFIED','COUNSELING_SCHEDULED','DOCUMENTATION','UNIVERSITY_APPLIED','OFFER_LETTER','VISA_PROCESSING','VISA_APPROVED','CONVERTED','LOST']
const SOURCES = ['WEBSITE','WHATSAPP','FACEBOOK_ADS','GOOGLE_ADS','INSTAGRAM','REFERRAL','WALK_IN','ORGANIC_SEARCH','EMAIL']

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  nationality: z.string().optional(),
  // ✅ FIX: backend accepts preferredCountries[] but create form sends single value —
  // send as an array so the backend CreateLeadRequest maps correctly
  preferredCountry: z.string().optional(),
  preferredIntake: z.string().optional(),
  preferredProgram: z.string().optional(),
  studyLevel: z.string().optional(),
  academicPercentage: z.number().min(0).max(100).optional().nullable(),
  hasIelts: z.boolean().optional(),
  ieltsScore: z.number().optional().nullable(),
  budgetMin: z.number().optional().nullable(),
  budgetMax: z.number().optional().nullable(),
  budgetCurrency: z.string().optional(),
  source: z.string().optional(),
  hasPassport: z.boolean().optional(),
  counselorId: z.string().optional(),           // ✅ FIX: was assignedCounselorId
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function LeadsPage() {
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [stageFilter, setStageFilter] = useState('')       // ✅ FIX: was statusFilter
  const [scoreFilter, setScoreFilter] = useState('')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { data, isLoading, refetch } = useQuery<Page<Lead>>({
    queryKey: ['leads', page, stageFilter, scoreFilter],
    queryFn: async () => {
      const r = await leadsApi.list({
        page,
        size: 20,
        sort: 'createdAt',
        direction: 'DESC',
        ...(stageFilter && { stage: stageFilter }),         // ✅ FIX: was { status: statusFilter }
        ...(scoreFilter && { qualificationLabel: scoreFilter }),
      })
      return r.data?.data ?? r.data
    },
  })

  const { data: counselors = [] } = useQuery<User[]>({
    queryKey: ['counselors'],
    queryFn: async () => {
      const r = await usersApi.counselors()
      return Array.isArray(r.data?.data) ? r.data.data : []
    },
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => leadsApi.create({
      ...d,
      // ✅ FIX: map single country string → array for backend
      preferredCountries: d.preferredCountry ? [d.preferredCountry] : undefined,
      preferredCountry: undefined,
      // ✅ FIX: map preferredProgram → array
      preferredPrograms: d.preferredProgram ? [d.preferredProgram] : undefined,
      preferredProgram: undefined,
      academicPercentage: d.academicPercentage || undefined,
      ieltsScore: d.ieltsScore || undefined,
      budgetMin: d.budgetMin || undefined,
      budgetMax: d.budgetMax || undefined,
      email: d.email || undefined,
      counselorId: d.counselorId || undefined,              // ✅ FIX: was assignedCounselorId
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      setShowCreate(false)
      reset()
      toast.success('Lead created successfully')
    },
  })

  const qualifyMutation = useMutation({
    mutationFn: (id: string) => leadsApi.qualify(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success('AI qualification started')
    },
  })

  const leads = data?.content ?? []
  const total = data?.totalElements ?? 0

  const filtered = search
    ? leads.filter(l =>
        l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.includes(search) ||
        l.stage?.toLowerCase().includes(search.toLowerCase())  // ✅ FIX: was l.status
      )
    : leads

  const handleExport = async () => {
    try {
      const res = await leadsApi.export(stageFilter ? { stage: stageFilter } : undefined) // ✅ FIX: was { status: statusFilter }
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click()
      URL.revokeObjectURL(url)
      toast.success('Exported successfully')
    } catch { toast.error('Export failed') }
  }

  const onSubmit = async (d: FormData) => { await createMutation.mutateAsync(d) }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {total} total{stageFilter && ` · filtered by ${stageFilter.replace(/_/g, ' ')}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => refetch()} className="btn-secondary text-sm"><RefreshCw size={14}/></button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary text-sm ${showFilters ? 'border-primary-500/50 text-primary-400' : ''}`}
          >
            <Filter size={14}/>Filters{(stageFilter || scoreFilter) && ' •'}
          </button>
          <button onClick={handleExport} className="btn-secondary text-sm"><Download size={14}/>Export</button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm"><Plus size={14}/>New Lead</button>
        </div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden">
            <div className="glass-card p-4 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9 py-2 text-sm"
                  placeholder="Search name, email, phone…"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <X size={14}/>
                  </button>
                )}
              </div>
              {/* ✅ FIX: was statusFilter / STATUSES / setStatusFilter */}
              <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(0) }} className="select-field w-auto py-2 text-sm">
                <option value="">All Stages</option>
                {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              <select value={scoreFilter} onChange={e => setScoreFilter(e.target.value)} className="select-field w-auto py-2 text-sm">
                <option value="">All Scores</option>
                {/* ✅ FIX: values match backend qualificationLabel enum */}
                <option value="HOT">🔥 Hot</option>
                <option value="WARM">⚡ Warm</option>
                <option value="COLD">❄️ Cold</option>
              </select>
              {(stageFilter || scoreFilter || search) && (
                <button
                  onClick={() => { setStageFilter(''); setScoreFilter(''); setSearch(''); setPage(0) }}
                  className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <X size={12}/>Clear
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Name','Contact','Destination','Score','Stage','Counselor','Budget','Created',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={9} className="py-14 text-center"><Loader2 size={24} className="animate-spin mx-auto text-primary-400"/></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="py-14 text-center text-gray-500">
                  {search || stageFilter ? 'No leads match your filters.' : 'No leads yet. Create your first lead!'}
                </td></tr>
              ) : filtered.map((lead, i) => (
                <motion.tr
                  key={lead.id}
                  initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.02}}
                  className="hover:bg-white/3 transition-colors group"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500/30 to-purple-500/30 rounded-lg flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                        {(lead.fullName || lead.firstName)?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-medium text-white">{lead.fullName || lead.firstName}</p>
                        <p className="text-xs text-gray-500">{lead.nationality}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300 text-xs">{lead.email || '—'}</p>
                    <p className="text-gray-500 text-xs">{lead.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {/* ✅ FIX: was lead.preferredCountry (string) → now array */}
                    <p className="text-gray-300 text-xs">{lead.preferredCountries?.[0] ?? '—'}</p>
                    <p className="text-gray-500 text-xs">{lead.preferredIntake || '—'}</p>
                  </td>
                  {/* ✅ FIX: was lead.leadScore → now lead.qualificationLabel */}
                  <td className="px-4 py-3">
                    {lead.qualificationLabel
                      ? <Badge value={lead.qualificationLabel}/>
                      : <span className="text-gray-600 text-xs">—</span>
                    }
                  </td>
                  {/* ✅ FIX: was lead.status → now lead.stage */}
                  <td className="px-4 py-3"><Badge value={lead.stage}/></td>
                  {/* ✅ FIX: was lead.assignedCounselor.firstName/lastName → now flat lead.counselorName */}
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {lead.counselorName ?? '—'}
                  </td>
                  {/* ✅ FIX: was lead.budget → now lead.budgetMin / lead.budgetMax */}
                  <td className="px-4 py-3 text-xs text-gray-300 whitespace-nowrap">
                    {lead.budgetMin
                      ? `${fmtCurrency(lead.budgetMin, lead.budgetCurrency)}${lead.budgetMax ? ` – ${fmtCurrency(lead.budgetMax, lead.budgetCurrency)}` : ''}`
                      : '—'
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => qualifyMutation.mutate(lead.id)}
                        disabled={qualifyMutation.isPending}
                        title="AI Qualify"
                        className="p-1.5 text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
                      >
                        <RefreshCw size={12}/>
                      </button>
                      <Link to={`/dashboard/leads/${lead.id}`} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <ChevronRight size={12}/>
                      </Link>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <p className="text-xs text-gray-400">Showing {page*20+1}–{Math.min((page+1)*20, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={(page+1)*20>=total} className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset() }} title="Create New Lead" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name *</label>
              <input {...register('firstName')} className="input-field" placeholder="Aarav"/>
              {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div><label className="label">Last Name</label><input {...register('lastName')} className="input-field" placeholder="Patel"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input {...register('email')} type="email" className="input-field" placeholder="student@email.com"/>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div><label className="label">Phone</label><input {...register('phone')} className="input-field" placeholder="+977-98…"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">WhatsApp</label><input {...register('whatsappNumber')} className="input-field" placeholder="+977-98…"/></div>
            <div><label className="label">Nationality</label><input {...register('nationality')} className="input-field" placeholder="Nepali"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Preferred Country</label>
              <select {...register('preferredCountry')} className="select-field">
                <option value="">Select…</option>
                {['Canada','Australia','UK','USA','Germany','New Zealand','Ireland','France','Netherlands','Singapore','Japan'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Preferred Intake</label>
              <select {...register('preferredIntake')} className="select-field">
                <option value="">Select…</option>
                {['September 2024','January 2025','May 2025','September 2025','January 2026'].map(i => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>
          {/* ✅ FIX: budget split into budgetMin / budgetMax */}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Academic %</label><input {...register('academicPercentage', {valueAsNumber:true})} type="number" step="0.1" min="0" max="100" className="input-field" placeholder="75.5"/></div>
            <div>
              <label className="label">Study Level</label>
              <select {...register('studyLevel')} className="select-field">
                <option value="">Select…</option>
                {['DIPLOMA','BACHELOR','MASTER','PHD','LANGUAGE'].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Budget Min (USD)</label><input {...register('budgetMin', {valueAsNumber:true})} type="number" className="input-field" placeholder="20000"/></div>
            <div><label className="label">Budget Max (USD)</label><input {...register('budgetMax', {valueAsNumber:true})} type="number" className="input-field" placeholder="40000"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              {/* ✅ FIX: was ieltsStatus select → now hasIelts boolean, matching backend Boolean */}
              <label className="label">Has IELTS?</label>
              <select {...register('hasIelts', { setValueAs: v => v === 'true' ? true : v === 'false' ? false : undefined })} className="select-field">
                <option value="">Select…</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div><label className="label">IELTS Score</label><input {...register('ieltsScore', {valueAsNumber:true})} type="number" step="0.5" min="0" max="9" className="input-field" placeholder="6.5"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Lead Source</label>
              <select {...register('source')} className="select-field">
                <option value="">Select…</option>
                {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              {/* ✅ FIX: was assignedCounselorId → now counselorId, matching LeadResponse.counselorId */}
              <label className="label">Assign Counselor</label>
              <select {...register('counselorId')} className="select-field">
                <option value="">Unassigned</option>
                {counselors.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
          </div>
          <div>
            {/* ✅ FIX: was passportStatus string → now hasPassport boolean */}
            <label className="label">Has Passport?</label>
            <select {...register('hasPassport', { setValueAs: v => v === 'true' ? true : v === 'false' ? false : undefined })} className="select-field">
              <option value="">Select…</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
          <div><label className="label">Notes</label><textarea {...register('notes')} className="input-field min-h-[70px]" placeholder="Additional notes…"/></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowCreate(false); reset() }} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}