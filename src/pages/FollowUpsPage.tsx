import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { followUpsApi, leadsApi } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useForm } from 'react-hook-form'
import { CheckCircle, AlertTriangle, Clock, Plus, Loader2 } from 'lucide-react'
import { fmtDateTime, fmtRelative } from '@/utils/format'
import toast from 'react-hot-toast'
import type { FollowUp, Page, Lead } from '@/types'

export default function FollowUpsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm()

  const { data, isLoading } = useQuery<Page<FollowUp>>({
    queryKey: ['followups-all'],
    queryFn: () => followUpsApi.list({ size: 200, sort: 'dueAt', direction: 'ASC' }).then(r => r.data),
    refetchInterval: 60_000,
  })
  const { data: leadsData } = useQuery<Page<Lead>>({
    queryKey: ['leads-select'],
    queryFn: () => leadsApi.list({ size: 200 }).then(r => r.data),
    enabled: showCreate,
  })

  const completeMutation = useMutation({
    mutationFn: (id: string) => followUpsApi.complete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['followups-all'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Follow-up completed') },
  })
  const createMutation = useMutation({
    mutationFn: (d: any) => followUpsApi.create({ ...d, priority: Number(d.priority) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['followups-all'] }); setShowCreate(false); reset(); toast.success('Follow-up created') },
  })

  const all: FollowUp[] = data?.content ?? []
  const shown = filter ? all.filter(f => f.status === filter) : all
  const overdue  = all.filter(f => f.status === 'OVERDUE').length
  const pending  = all.filter(f => f.status === 'PENDING').length
  const completed= all.filter(f => f.status === 'COMPLETED').length

  const ICON = { OVERDUE: AlertTriangle, PENDING: Clock, COMPLETED: CheckCircle } as const
  const COLOR = { OVERDUE:'text-red-400 bg-red-500/10', PENDING:'text-amber-400 bg-amber-500/10', COMPLETED:'text-green-400 bg-green-500/10' } as const

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Follow-ups</h1>
          <p className="text-sm text-gray-400 mt-0.5">{overdue} overdue · {pending} pending</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15}/>Add Follow-up</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([['OVERDUE','Overdue',overdue],['PENDING','Pending',pending],['COMPLETED','Completed',completed]] as [string,string,number][]).map(([s,l,c]) => (
          <button key={s} onClick={() => setFilter(filter === s ? '' : s)}
            className={`stat-card text-left transition-all ${filter === s ? 'border-primary-500/50' : ''}`}>
            <p className={`text-3xl font-bold ${s==='OVERDUE'?'text-red-400':s==='PENDING'?'text-amber-400':'text-green-400'}`}>{c}</p>
            <p className="text-sm text-gray-400 mt-1">{l}{filter === s && ' ✓'}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-400"/></div>
      ) : shown.length === 0 ? (
        <div className="glass-card p-12 text-center"><AlertTriangle size={48} className="text-gray-700 mx-auto mb-3"/><p className="text-gray-400">{filter ? `No ${filter.toLowerCase()} follow-ups` : 'No follow-ups yet'}</p></div>
      ) : (
        <div className="space-y-3">
          {shown.map(fu => {
            const status = fu.status as keyof typeof ICON
            const Icon = ICON[status] || Clock
            const cls  = COLOR[status] || 'text-gray-400 bg-gray-500/10'
            return (
              <div key={fu.id} className="glass-card p-4 flex items-start gap-4">
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${cls.split(' ')[1]}`}><Icon size={15} className={cls.split(' ')[0]}/></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-semibold text-white">{fu.title}</p>
                    <Badge value={fu.status}/>
                    {fu.priority === 1 && <span className="text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">High</span>}
                  </div>
                  {fu.description && <p className="text-xs text-gray-400">{fu.description}</p>}
                  <div className="flex gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">Due: {fmtDateTime(fu.dueAt)} · {fmtRelative(fu.dueAt)}</span>
                    {fu.channel && <span className="text-xs text-gray-600">via {fu.channel}</span>}
                    {fu.lead && <span className="text-xs text-gray-500">Lead: {(fu.lead as any).fullName || (fu.lead as any).firstName}</span>}
                  </div>
                </div>
                {fu.status !== 'COMPLETED' && (
                  <button onClick={() => completeMutation.mutate(fu.id)} disabled={completeMutation.isPending} className="btn-secondary text-xs py-1.5 flex-shrink-0">
                    <CheckCircle size={12}/> Complete
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset() }} title="Add Follow-up">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Lead *</label>
            <select {...register('leadId', { required: true })} className="select-field">
              <option value="">Select lead…</option>
              {(leadsData?.content ?? []).map(l => <option key={l.id} value={l.id}>{l.fullName || l.firstName}</option>)}
            </select>
          </div>
          <div><label className="label">Title *</label><input {...register('title', { required: true })} className="input-field" placeholder="e.g. Check IELTS result"/></div>
          <div><label className="label">Description</label><textarea {...register('description')} className="input-field min-h-[70px]"/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Due Date *</label><input {...register('dueAt', { required: true })} type="datetime-local" className="input-field"/></div>
            <div>
              <label className="label">Priority</label>
              <select {...register('priority')} className="select-field" defaultValue="2">
                <option value="1">🔴 High</option><option value="2">🟡 Medium</option><option value="3">🟢 Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Channel</label>
            <select {...register('channel')} className="select-field">
              <option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="email">Email</option><option value="in_person">In Person</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowCreate(false); reset() }} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">{isSubmitting ? <Loader2 size={14} className="animate-spin"/> : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
