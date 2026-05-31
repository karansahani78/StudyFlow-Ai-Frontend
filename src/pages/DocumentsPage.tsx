import { useQuery } from '@tanstack/react-query'
import { leadsApi } from '@/services/api'
import { FileText } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Link } from 'react-router-dom'
import type { Lead, Page } from '@/types'

export default function DocumentsPage() {
  const { data, isLoading } = useQuery<Page<Lead>>({
    queryKey: ['leads','doc-stage'],
    queryFn: () => leadsApi.list({ size: 100, status: 'DOCUMENTATION' }).then(r => r.data),
  })
  const docLeads = data?.content ?? []

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Documents</h1>
        <p className="text-sm text-gray-400 mt-0.5">Leads in documentation stage — click to manage their documents</p>
      </div>
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/8 flex items-center justify-between">
          <span className="text-sm font-medium text-white">{docLeads.length} leads in Documentation</span>
          <Link to="/dashboard/leads?status=DOCUMENTATION" className="text-xs text-primary-400 hover:text-primary-300">View all →</Link>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : docLeads.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={48} className="text-gray-700 mx-auto mb-3"/>
            <p className="text-gray-400">No leads in documentation stage</p>
            <p className="text-sm text-gray-500 mt-1">Move leads to "Documentation" status to manage their documents here</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {docLeads.map(lead => (
              <div key={lead.id} className="p-4 flex items-center gap-4 hover:bg-white/3 transition-colors">
                <div className="w-9 h-9 bg-primary-500/20 rounded-xl flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
                  {(lead.fullName || lead.firstName)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{lead.fullName || lead.firstName}</p>
                  <p className="text-xs text-gray-400">{lead.preferredCountry} · {lead.preferredProgram || 'No program'} · {lead.documentCount ?? 0} docs uploaded</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge value={lead.status}/>
                  {lead.assignedCounselor && (
                    <span className="text-xs text-gray-400">{lead.assignedCounselor.firstName}</span>
                  )}
                  <Link to={`/dashboard/leads/${lead.id}`} className="btn-secondary text-xs py-1.5">Manage Docs</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
