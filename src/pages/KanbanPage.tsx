import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { leadsApi } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import { fmtCurrency, fmtDate } from '@/utils/format'
import { Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Lead, Page } from '@/types'

const COLS = [
  { id:'NEW_INQUIRY',          label:'New Inquiry',        color:'#8b5cf6' },
  { id:'CONTACTED',            label:'Contacted',          color:'#3b82f6' },
  { id:'QUALIFIED',            label:'Qualified',          color:'#06b6d4' },
  { id:'COUNSELING_SCHEDULED', label:'Counseling',         color:'#6366f1' },
  { id:'DOCUMENTATION',        label:'Documentation',      color:'#f59e0b' },
  { id:'UNIVERSITY_APPLIED',   label:'Applied',            color:'#f97316' },
  { id:'OFFER_LETTER',         label:'Offer Letter',       color:'#14b8a6' },
  { id:'VISA_PROCESSING',      label:'Visa Processing',    color:'#a855f7' },
  { id:'VISA_APPROVED',        label:'Visa Approved',      color:'#10b981' },
  { id:'CONVERTED',            label:'Converted ✓',        color:'#22c55e' },
]

export default function KanbanPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<Page<Lead>>({
    queryKey: ['leads','kanban'],
    queryFn: () => leadsApi.list({ size: 300, sort: 'createdAt', direction: 'DESC' }).then(r => r.data),
  })
  const leads = data?.content ?? []

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => leadsApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads','kanban'] }),
    onError: () => toast.error('Failed to update status'),
  })

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.droppableId === result.source.droppableId) return
    updateStatus.mutate({ id: result.draggableId, status: result.destination.droppableId })
  }

  const byStatus = (s: string) => leads.filter(l => l.status === s)

  if (isLoading) return (
    <div className="flex justify-center items-center h-64"><Loader2 size={28} className="animate-spin text-primary-400"/></div>
  )

  return (
    <div className="animate-fade-in">
      <div className="mb-5">
        <h1 className="page-title">Pipeline</h1>
        <p className="text-sm text-gray-400 mt-0.5">{leads.length} leads · drag to move between stages</p>
      </div>
      <div className="overflow-x-auto pb-6 scrollbar-thin">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 min-w-max">
            {COLS.map(col => {
              const colLeads = byStatus(col.id)
              return (
                <div key={col.id} className="w-60 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }}/>
                    <span className="text-xs font-semibold text-gray-300 truncate">{col.label}</span>
                    <span className="ml-auto text-xs bg-white/10 text-gray-400 px-1.5 py-0.5 rounded-full">{colLeads.length}</span>
                  </div>
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}
                        className={`min-h-[100px] rounded-xl p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? 'ring-1 ring-primary-500/50 bg-primary-500/5' : 'bg-white/3'}`}>
                        {colLeads.map((lead, i) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={i}>
                            {(prov, snap) => (
                              <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                className={`bg-gray-900 border rounded-xl p-3 select-none transition-all ${snap.isDragging ? 'border-primary-500/60 shadow-glow scale-[1.02]' : 'border-white/10 hover:border-white/20'}`}>
                                <div className="flex items-start justify-between gap-1 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: col.color + '44' }}>
                                      {(lead.fullName || lead.firstName)?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-white truncate">{lead.fullName || lead.firstName}</p>
                                      <p className="text-xs text-gray-500 truncate">{lead.preferredCountry || '—'}</p>
                                    </div>
                                  </div>
                                  <Link to={`/dashboard/leads/${lead.id}`} className="text-gray-600 hover:text-primary-400 transition-colors flex-shrink-0">
                                    <ExternalLink size={11}/>
                                  </Link>
                                </div>
                                <div className="flex items-center justify-between gap-1 flex-wrap">
                                  {lead.leadScore && <Badge value={lead.leadScore}/>}
                                  {lead.budget && <span className="text-xs text-gray-400">{fmtCurrency(lead.budget)}</span>}
                                </div>
                                {lead.qualificationScore != null && (
                                  <div className="mt-2">
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all" style={{ width: `${lead.qualificationScore}%`, background: col.color }}/>
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-gray-600 mt-1.5">{fmtDate(lead.createdAt)}</p>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {colLeads.length === 0 && !snapshot.isDraggingOver && (
                          <div className="text-center py-5 text-xs text-gray-700">Empty</div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
