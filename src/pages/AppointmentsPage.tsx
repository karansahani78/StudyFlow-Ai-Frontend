import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { appointmentsApi, leadsApi, usersApi } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Plus, Video, Phone, MapPin, Loader2, Trash2 } from 'lucide-react'
import { fmtDateTime } from '@/utils/format'
import toast from 'react-hot-toast'
import type { Appointment, Page, Lead, User } from '@/types'

const schema = z.object({
  leadId:          z.string().min(1, 'Required'),
  counselorId:     z.string().min(1, 'Required'),
  startAt:         z.string().min(1, 'Required'),
  endAt:           z.string().min(1, 'Required'),
  type:            z.string().optional(),
  title:           z.string().optional(),
  notes:           z.string().optional(),
  meetingLink:     z.string().optional(),
  meetingPlatform: z.string().optional(),
})
type F = z.infer<typeof schema>

const platformIcon = (p?: string) => {
  if (p === 'zoom' || p === 'google_meet') return <Video size={13} className="text-blue-400"/>
  if (p === 'phone') return <Phone size={13} className="text-green-400"/>
  return <MapPin size={13} className="text-orange-400"/>
}

export default function AppointmentsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) })

  const { data, isLoading } = useQuery<Page<Appointment>>({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list({ size: 50, sort: 'startAt', direction: 'ASC' }).then(r => r.data),
  })
  const { data: leadsData } = useQuery<Page<Lead>>({
    queryKey: ['leads-select'],
    queryFn: () => leadsApi.list({ size: 200 }).then(r => r.data),
    enabled: showCreate,
  })
  const { data: counselors = [] } = useQuery<User[]>({
    queryKey: ['counselors'],
    queryFn: () => usersApi.counselors().then(r => r.data),
    enabled: showCreate,
  })

  const createMutation = useMutation({
    mutationFn: (d: F) => appointmentsApi.create({
      ...d,
      // datetime-local gives YYYY-MM-DDTHH:mm — backend expects ISO LocalDateTime
      startAt: d.startAt.includes('T') ? d.startAt : d.startAt,
      endAt:   d.endAt.includes('T') ? d.endAt : d.endAt,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); setShowCreate(false); reset(); toast.success('Appointment scheduled') },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => appointmentsApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Status updated') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['appointments'] }); toast.success('Appointment deleted') },
  })

  const appts = data?.content ?? []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="text-sm text-gray-400 mt-0.5">{appts.length} scheduled</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary"><Plus size={15}/>Schedule</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-14"><Loader2 size={24} className="animate-spin text-primary-400"/></div>
      ) : appts.length === 0 ? (
        <div className="glass-card p-14 text-center">
          <Calendar size={48} className="text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-400 mb-4">No appointments scheduled yet</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto"><Plus size={14}/>Schedule First Appointment</button>
        </div>
      ) : (
        <div className="space-y-3">
          {appts.map((appt, i) => {
            const start = new Date(appt.startAt)
            return (
              <motion.div key={appt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card p-5 flex items-center gap-5 hover:border-primary-500/20 transition-all group">
                <div className="text-center bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 min-w-[60px] flex-shrink-0">
                  <p className="text-2xl font-bold text-primary-400 leading-none">{start.getDate()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{start.toLocaleString('en', { month: 'short' })}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-white">{appt.title || appt.type.replace(/_/g, ' ')}</h3>
                    <Badge value={appt.status}/>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                    <span>👤 {appt.leadName}</span>
                    {appt.counselor && <span>🎓 {appt.counselor.firstName} {appt.counselor.lastName}</span>}
                    <span>🕐 {fmtDateTime(appt.startAt)}</span>
                    <span>{appt.durationMinutes}min</span>
                    {appt.meetingPlatform && <span className="flex items-center gap-1">{platformIcon(appt.meetingPlatform)} {appt.meetingPlatform}</span>}
                  </div>
                  {appt.meetingLink && <a href={appt.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-primary-400 hover:text-primary-300 mt-1 block">Join meeting →</a>}
                  {appt.notes && <p className="text-xs text-gray-500 mt-1">{appt.notes}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {appt.status === 'SCHEDULED' && (<>
                    <button onClick={() => statusMutation.mutate({ id: appt.id, status: 'COMPLETED' })} className="btn-secondary text-xs py-1.5">Complete</button>
                    <button onClick={() => statusMutation.mutate({ id: appt.id, status: 'CANCELLED' })} className="btn-danger text-xs py-1.5">Cancel</button>
                  </>)}
                  <button onClick={() => deleteMutation.mutate(appt.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={14}/></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); reset() }} title="Schedule Appointment">
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Lead *</label>
            <select {...register('leadId')} className="select-field">
              <option value="">Select lead…</option>
              {(leadsData?.content ?? []).map(l => <option key={l.id} value={l.id}>{l.fullName || l.firstName} — {l.preferredCountry || 'N/A'}</option>)}
            </select>
            {errors.leadId && <p className="text-red-400 text-xs mt-1">{errors.leadId.message}</p>}
          </div>
          <div>
            <label className="label">Counselor *</label>
            <select {...register('counselorId')} className="select-field">
              <option value="">Select counselor…</option>
              {counselors.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
            {errors.counselorId && <p className="text-red-400 text-xs mt-1">{errors.counselorId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start *</label>
              <input {...register('startAt')} type="datetime-local" className="input-field"/>
              {errors.startAt && <p className="text-red-400 text-xs mt-1">{errors.startAt.message}</p>}
            </div>
            <div>
              <label className="label">End *</label>
              <input {...register('endAt')} type="datetime-local" className="input-field"/>
              {errors.endAt && <p className="text-red-400 text-xs mt-1">{errors.endAt.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Type</label>
            <select {...register('type')} className="select-field">
              <option value="INITIAL_CONSULTATION">Initial Consultation</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="DOCUMENT_REVIEW">Document Review</option>
              <option value="VISA_BRIEFING">Visa Briefing</option>
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input {...register('title')} className="input-field" placeholder="e.g. Canada Study Options"/>
          </div>
          <div>
            <label className="label">Meeting Platform</label>
            <select {...register('meetingPlatform')} className="select-field">
              <option value="">In-Person / Office</option>
              <option value="zoom">Zoom</option>
              <option value="google_meet">Google Meet</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>
          <div>
            <label className="label">Meeting Link</label>
            <input {...register('meetingLink')} className="input-field" placeholder="https://meet.google.com/…"/>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea {...register('notes')} className="input-field min-h-[70px]"/>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowCreate(false); reset() }} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">
              {isSubmitting ? <Loader2 size={15} className="animate-spin"/> : 'Schedule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
