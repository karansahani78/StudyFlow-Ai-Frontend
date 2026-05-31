import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leadsApi, documentsApi, followUpsApi, notesApi, activityApi, usersApi } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Brain, Upload, Plus, FileText, Calendar, AlertTriangle, Loader2, Trash2, Pin, Activity } from 'lucide-react'
import { fmtDate, fmtDateTime, fmtCurrency, fmtRelative } from '@/utils/format'
import toast from 'react-hot-toast'
import type { Lead, Document, FollowUp, Note, ActivityLog, User } from '@/types'

// ✅ FIX: renamed from STATUSES → STAGES to match backend `stage` field
const STAGES = ['NEW_INQUIRY','CONTACTED','QUALIFIED','COUNSELING_SCHEDULED','DOCUMENTATION','UNIVERSITY_APPLIED','OFFER_LETTER','VISA_PROCESSING','VISA_APPROVED','CONVERTED','LOST']
const DOC_TYPES = ['PASSPORT','TRANSCRIPT','IELTS_SCORE','PTE_SCORE','TOEFL_SCORE','SOP','LOR','CV','FINANCIAL_DOCS','BANK_STATEMENT','OFFER_LETTER','OTHER']

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'overview'|'documents'|'followups'|'notes'|'activity'>('overview')
  const [showDocModal, setShowDocModal] = useState(false)
  const [showFUModal, setShowFUModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedDocType, setSelectedDocType] = useState('PASSPORT')

  const { register: regFU, handleSubmit: hsFU, reset: resetFU, formState: { isSubmitting: fuSubmitting } } = useForm()
  const { register: regNote, handleSubmit: hsNote, reset: resetNote } = useForm()

  const { data: counselors = [] } = useQuery<User[]>({
    queryKey: ['counselors'],
    queryFn: async () => {
      const r = await usersApi.counselors()
      return Array.isArray(r.data?.data) ? r.data.data : []
    },
  })

  const { data: lead, isLoading } = useQuery<Lead>({
    queryKey: ['lead', id], enabled: !!id,
    queryFn: () => leadsApi.get(id!).then(r => r.data),
  })
  const { data: docs = [] } = useQuery<Document[]>({
    queryKey: ['docs', id], enabled: !!id && tab === 'documents',
    queryFn: () => documentsApi.list(id!).then(r => r.data),
  })
  const { data: fuPage } = useQuery({
    queryKey: ['followups', id], enabled: !!id && tab === 'followups',
    queryFn: () => followUpsApi.list({ size: 100 }).then(r => r.data),
  })
  const { data: notes = [] } = useQuery<Note[]>({
    queryKey: ['notes', id], enabled: !!id && tab === 'notes',
    queryFn: () => notesApi.list(id!).then(r => r.data),
  })
  const { data: activity = [] } = useQuery<ActivityLog[]>({
    queryKey: ['activity', id], enabled: !!id && tab === 'activity',
    queryFn: () => activityApi.leadTrail(id!).then(r => r.data),
  })

  // ✅ FIX: was updateStatus(id!, status) — field is now `stage`
  const stageMutation = useMutation({
    mutationFn: (stage: string) => leadsApi.updateStage(id!, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      toast.success('Stage updated')
    },
  })
  const qualifyMutation = useMutation({
    mutationFn: () => leadsApi.qualify(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] })
      toast.success('AI qualification started – refresh in a moment')
    },
  })
  // ✅ FIX: was assignMutation using leadsApi.assign — counselorId matches DTO
  const assignMutation = useMutation({
    mutationFn: (counselorId: string) => leadsApi.assign(id!, counselorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lead', id] })
      toast.success('Counselor assigned')
    },
  })
  const docStatusMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: string }) => documentsApi.updateStatus(docId, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['docs', id] }); toast.success('Document status updated') },
  })
  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => documentsApi.delete(docId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['docs', id] }); toast.success('Document deleted') },
  })
  const completeFUMutation = useMutation({
    mutationFn: (fuId: string) => followUpsApi.complete(fuId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['followups', id] }); toast.success('Follow-up completed') },
  })
  const createFUMutation = useMutation({
    mutationFn: (d: any) => followUpsApi.create({ ...d, leadId: id, priority: Number(d.priority) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['followups', id] }); setShowFUModal(false); resetFU(); toast.success('Follow-up created') },
  })
  const createNoteMutation = useMutation({
    mutationFn: (d: any) => notesApi.create(id!, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', id] }); resetNote(); toast.success('Note added') },
  })
  const deleteNoteMutation = useMutation({
    mutationFn: (nId: string) => notesApi.delete(id!, nId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', id] }); toast.success('Note deleted') },
  })

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploading(true)
    try {
      await documentsApi.upload(id, file, selectedDocType)
      qc.invalidateQueries({ queryKey: ['docs', id] })
      toast.success('Document uploaded')
      setShowDocModal(false)
    } catch { toast.error('Upload failed') } finally { setUploading(false) }
  }

  const handleDownload = async (docId: string, name: string) => {
    try {
      const { data } = await documentsApi.download(docId)
      window.open(data as string, '_blank')
    } catch { toast.error('Download failed') }
  }

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-primary-400"/></div>
  if (!lead) return <div className="text-center py-24 text-gray-400">Lead not found</div>

  const followUps: FollowUp[] = (fuPage as any)?.content?.filter((f: any) => f.lead?.id === id || f.leadId === id) ?? []
  const tabs = [
    { id: 'overview',  label: 'Overview' },
    { id: 'documents', label: `Documents (${lead.documentCount ?? docs.length})` }, // ✅ FIX: use documentCount from DTO
    { id: 'followups', label: `Follow-ups (${followUps.length})` },
    { id: 'notes',     label: `Notes (${notes.length})` },
    { id: 'activity',  label: 'Activity' },
  ] as const

  return (
    <div className="space-y-5 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl mt-1 flex-shrink-0">
          <ArrowLeft size={18}/>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500/30 to-purple-500/30 rounded-2xl flex items-center justify-center text-xl font-bold text-primary-400 flex-shrink-0">
              {(lead.fullName || lead.firstName)?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{lead.fullName || lead.firstName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* ✅ FIX: was lead.status → lead.stage */}
                <Badge value={lead.stage}/>
                {/* ✅ FIX: was lead.leadScore → lead.qualificationLabel */}
                {lead.qualificationLabel && <Badge value={lead.qualificationLabel}/>}
                {lead.qualificationScore != null && (
                  <span className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                    AI Score: {lead.qualificationScore}/100
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => qualifyMutation.mutate()}
            disabled={qualifyMutation.isPending}
            className="btn-secondary text-sm"
          >
            <Brain size={14}/>{qualifyMutation.isPending ? 'Running AI…' : 'AI Qualify'}
          </button>
          {/* ✅ FIX: was lead.status / STATUSES / statusMutation → lead.stage / STAGES / stageMutation */}
          <select
            value={lead.stage}
            onChange={e => stageMutation.mutate(e.target.value)}
            className="select-field w-auto text-sm py-2"
          >
            {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* AI Summary — fields not in LeadResponse DTO; render only if present */}
      {(lead as any).aiSummary && (
        <div className="glass-card p-4 border-primary-500/20 flex gap-3">
          <Brain size={18} className="text-primary-400 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-xs font-semibold text-primary-400 mb-1">AI Summary</p>
            <p className="text-sm text-gray-300">{(lead as any).aiSummary}</p>
            {(lead as any).aiRecommendation && (
              <p className="text-sm text-amber-300 mt-1">💡 {(lead as any).aiRecommendation}</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="glass-card p-5 space-y-3">
            <h3 className="section-title text-base">Personal Info</h3>
            {([
              ['Email',    lead.email],
              ['Phone',    lead.phone],
              ['WhatsApp', lead.whatsappNumber],
              ['Nationality', lead.nationality],
              ['Location', lead.currentLocation],  // ✅ FIX: was lead.location (not in DTO) → currentLocation
              ['Source',   lead.source],
              ['Passport', lead.hasPassport != null ? (lead.hasPassport ? 'Yes' : 'No') : null],  // ✅ FIX: was passportStatus string → hasPassport boolean
              ['Visa Refusal', lead.visaRefusalHistory != null ? (lead.visaRefusalHistory ? 'Yes' : 'No') : null], // ✅ bonus: show visa refusal
            ] as [string, string|null|undefined][]).map(([k, v]) => v != null ? (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-200">{v}</span>
              </div>
            ) : null)}
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="section-title text-base">Academic & Study Preferences</h3>
            {([
              ['Study Level',   lead.studyLevel],                                               // ✅ FIX: was highestEducation → studyLevel
              ['Academic %',    lead.academicPercentage != null ? `${lead.academicPercentage}%` : null],
              ['Has IELTS',     lead.hasIelts != null ? (lead.hasIelts ? 'Yes' : 'No') : null], // ✅ FIX: was ieltsStatus string → hasIelts boolean
              ['IELTS Score',   lead.ieltsScore != null ? String(lead.ieltsScore) : null],
              // ✅ FIX: was lead.preferredCountry (string) → preferredCountries array
              ['Country',       lead.preferredCountries?.join(', ') ?? null],
              // ✅ FIX: was lead.preferredProgram (string) → preferredPrograms array
              ['Program',       lead.preferredPrograms?.join(', ') ?? null],
              ['Intake',        lead.preferredIntake],
              // ✅ FIX: was lead.budget single → budgetMin/budgetMax range
              ['Budget',        lead.budgetMin != null
                                  ? `${fmtCurrency(lead.budgetMin, lead.budgetCurrency)}${lead.budgetMax ? ` – ${fmtCurrency(lead.budgetMax, lead.budgetCurrency)}` : ''}`
                                  : null],
            ] as [string, string|null|undefined][]).map(([k, v]) => v != null ? (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-200">{v}</span>
              </div>
            ) : null)}
          </div>

          <div className="glass-card p-5 space-y-3">
            <h3 className="section-title text-base">Assignment</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Counselor</span>
              {/* ✅ FIX: was lead.assignedCounselor?.id → lead.counselorId (flat field in DTO) */}
              <select
                defaultValue={lead.counselorId || ''}
                onChange={e => e.target.value && assignMutation.mutate(e.target.value)}
                className="select-field w-auto text-sm py-1.5"
              >
                <option value="">Unassigned</option>
                {counselors.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            {/* ✅ FIX: counselorName is a flat string in DTO — show it as read-only info */}
            {lead.counselorName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assigned To</span>
                <span className="text-gray-200">{lead.counselorName}</span>
              </div>
            )}
            {lead.lastContactedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Contact</span>
                <span className="text-gray-200">{fmtRelative(lead.lastContactedAt)}</span>
              </div>
            )}
            {lead.nextFollowUpAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Next Follow-up</span>
                <span className="text-amber-300">{fmtDateTime(lead.nextFollowUpAt)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Created</span>
              <span className="text-gray-200">{fmtDate(lead.createdAt)}</span>
            </div>
          </div>

          {lead.notes && (
            <div className="glass-card p-5">
              <h3 className="section-title text-base mb-3">Notes</h3>
              <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DOCUMENTS ── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="section-title">Documents ({lead.documentCount ?? docs.length})</h3>
            <button onClick={() => setShowDocModal(true)} className="btn-primary text-sm"><Upload size={14}/>Upload</button>
          </div>
          {docs.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <FileText size={48} className="text-gray-700 mx-auto mb-3"/>
              <p className="text-gray-400">No documents yet</p>
              <button onClick={() => setShowDocModal(true)} className="btn-primary mt-4 mx-auto"><Upload size={14}/>Upload First Document</button>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => (
                <div key={doc.id} className="glass-card p-4 flex items-center gap-4 group">
                  <div className="p-2.5 bg-primary-500/10 rounded-xl flex-shrink-0"><FileText size={17} className="text-primary-400"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.originalName}</p>
                    <p className="text-xs text-gray-400">{doc.documentType.replace(/_/g, ' ')} · {(doc.fileSize/1024).toFixed(1)} KB · {fmtDate(doc.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge value={doc.status}/>
                    {doc.status === 'UPLOADED' && (
                      <>
                        <button onClick={() => docStatusMutation.mutate({ docId: doc.id, status: 'APPROVED' })} className="text-xs text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-1 rounded-lg transition-colors">Approve</button>
                        <button onClick={() => docStatusMutation.mutate({ docId: doc.id, status: 'REJECTED' })} className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded-lg transition-colors">Reject</button>
                      </>
                    )}
                    <button onClick={() => handleDownload(doc.id, doc.originalName)} className="btn-secondary text-xs py-1 px-2">Download</button>
                    <button onClick={() => deleteDocMutation.mutate(doc.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"><Trash2 size={13}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Modal isOpen={showDocModal} onClose={() => setShowDocModal(false)} title="Upload Document" size="sm">
            <div className="space-y-4">
              <div>
                <label className="label">Document Type</label>
                <select value={selectedDocType} onChange={e => setSelectedDocType(e.target.value)} className="select-field">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <label className={`flex flex-col items-center gap-3 p-8 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-primary-500/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploading ? <Loader2 size={24} className="animate-spin text-primary-400"/> : <Upload size={24} className="text-gray-400"/>}
                <span className="text-sm text-gray-400">{uploading ? 'Uploading…' : 'Click to select file (PDF, DOC, JPG, PNG – max 50MB)'}</span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" onChange={handleDocUpload} disabled={uploading}/>
              </label>
            </div>
          </Modal>
        </div>
      )}

      {/* ── FOLLOW-UPS ── */}
      {tab === 'followups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="section-title">Follow-ups ({followUps.length})</h3>
            <button onClick={() => setShowFUModal(true)} className="btn-primary text-sm"><Plus size={14}/>Add Follow-up</button>
          </div>
          {followUps.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <AlertTriangle size={48} className="text-gray-700 mx-auto mb-3"/>
              <p className="text-gray-400">No follow-ups scheduled</p>
              <button onClick={() => setShowFUModal(true)} className="btn-primary mt-4 mx-auto"><Plus size={14}/>Schedule First Follow-up</button>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map(fu => (
                <div key={fu.id} className="glass-card p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-xl flex-shrink-0 ${fu.status==='OVERDUE'?'bg-red-500/10':fu.status==='COMPLETED'?'bg-green-500/10':'bg-amber-500/10'}`}>
                    <AlertTriangle size={15} className={fu.status==='OVERDUE'?'text-red-400':fu.status==='COMPLETED'?'text-green-400':'text-amber-400'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{fu.title}</p>
                    {fu.description && <p className="text-xs text-gray-400 mt-0.5">{fu.description}</p>}
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-500">Due: {fmtDateTime(fu.dueAt)}</span>
                      {fu.channel && <span className="text-xs text-gray-600">via {fu.channel}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge value={fu.status}/>
                    {fu.status !== 'COMPLETED' && (
                      <button onClick={() => completeFUMutation.mutate(fu.id)} className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg hover:bg-green-500/20 transition-colors">Complete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Modal isOpen={showFUModal} onClose={() => { setShowFUModal(false); resetFU() }} title="Add Follow-up">
            <form onSubmit={hsFU(d => createFUMutation.mutate(d))} className="space-y-4">
              <div><label className="label">Title *</label><input {...regFU('title', { required: true })} className="input-field" placeholder="Check IELTS progress"/></div>
              <div><label className="label">Description</label><textarea {...regFU('description')} className="input-field min-h-[70px]"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Due Date *</label><input {...regFU('dueAt', { required: true })} type="datetime-local" className="input-field"/></div>
                <div>
                  <label className="label">Priority</label>
                  <select {...regFU('priority')} className="select-field" defaultValue="2">
                    <option value="1">🔴 High</option>
                    <option value="2">🟡 Medium</option>
                    <option value="3">🟢 Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Channel</label>
                <select {...regFU('channel')} className="select-field">
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="in_person">In Person</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowFUModal(false); resetFU() }} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={fuSubmitting} className="btn-primary flex-1 justify-center">
                  {fuSubmitting ? <Loader2 size={14} className="animate-spin"/> : 'Create'}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* ── NOTES ── */}
      {tab === 'notes' && (
        <div className="space-y-4">
          <form onSubmit={hsNote(d => createNoteMutation.mutate(d))} className="glass-card p-4 space-y-3">
            <textarea {...regNote('content', { required: true })} className="input-field min-h-[90px] w-full" placeholder="Add a note…"/>
            <div className="flex gap-3">
              <select {...regNote('visibility')} className="select-field w-auto text-sm py-1.5">
                <option value="team">Team only</option>
                <option value="private">Private</option>
              </select>
              <button type="submit" disabled={createNoteMutation.isPending} className="btn-primary ml-auto text-sm">
                {createNoteMutation.isPending ? <Loader2 size={14} className="animate-spin"/> : 'Add Note'}
              </button>
            </div>
          </form>
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">No notes yet. Add the first note above.</div>
          ) : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="glass-card p-4 group">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      {n.pinned && <Pin size={12} className="text-primary-400"/>}
                      <span className="text-xs text-gray-500">{n.author?.firstName} {n.author?.lastName} · {fmtRelative(n.createdAt)}</span>
                      <span className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">{n.visibility}</span>
                    </div>
                    <button onClick={() => deleteNoteMutation.mutate(n.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"><Trash2 size={13}/></button>
                  </div>
                  <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ACTIVITY ── */}
      {tab === 'activity' && (
        <div className="space-y-3">
          {activity.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              <Activity size={32} className="mx-auto mb-3 text-gray-700"/>No activity yet
            </div>
          ) : activity.map(a => (
            <div key={a.id} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300">{a.description}</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {fmtRelative(a.createdAt)}{a.user ? ` · ${a.user.firstName} ${a.user.lastName}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}