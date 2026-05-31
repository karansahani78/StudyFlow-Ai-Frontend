import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi } from '@/services/api'
import { Badge } from '@/components/ui/Badge'
import { MessageSquare, Bot, User, AlertTriangle, Loader2, CheckCircle } from 'lucide-react'
import { fmtRelative } from '@/utils/format'
import type { Conversation, Page } from '@/types'

const CHANNEL_ICON: Record<string, string> = {
  WHATSAPP: '💬', WEBSITE_CHATBOT: '🤖', EMAIL: '📧', INSTAGRAM: '📸', FACEBOOK_MESSENGER: '🔵'
}

export default function InboxPage() {
  const qc = useQueryClient()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading } = useQuery<Page<Conversation>>({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.list({ size: 50, sort: 'updatedAt', direction: 'DESC' }).then(r => r.data),
    refetchInterval: 15_000,
  })

  const { data: detail, isLoading: detailLoading } = useQuery<Conversation>({
    queryKey: ['conversation', selectedId],
    queryFn: () => conversationsApi.get(selectedId!).then(r => r.data),
    enabled: !!selectedId,
    refetchInterval: 10_000,
  })

  const handoffMutation = useMutation({
    mutationFn: (id: string) => conversationsApi.handoff(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['conversations'] }); qc.invalidateQueries({ queryKey: ['conversation', selectedId] }) },
  })

  const conversations = data?.content ?? []
  const selected = selectedId ? conversations.find(c => c.id === selectedId) : null

  return (
    <div className="animate-fade-in h-[calc(100vh-140px)] flex flex-col">
      <div className="mb-4">
        <h1 className="page-title">Unified Inbox</h1>
        <p className="text-sm text-gray-400 mt-0.5">All conversations across channels</p>
      </div>
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar */}
        <div className="w-72 flex-shrink-0 glass-card flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/8 text-xs text-gray-400 font-medium">{conversations.length} conversations</div>
          <div className="flex-1 overflow-y-auto scrollbar-thin divide-y divide-white/5">
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-primary-400"/></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">No conversations yet</div>
            ) : conversations.map(conv => (
              <button key={conv.id} onClick={() => setSelectedId(conv.id)}
                className={`w-full p-3 text-left hover:bg-white/5 transition-colors ${selectedId === conv.id ? 'bg-primary-500/10 border-l-2 border-primary-500' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-lg flex-shrink-0 mt-0.5">{CHANNEL_ICON[conv.channel] || '💬'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 justify-between">
                      <p className="text-xs font-semibold text-white truncate">{conv.lead?.fullName || conv.channelIdentifier || 'Visitor'}</p>
                      {conv.unreadCount > 0 && <span className="bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold flex-shrink-0">{conv.unreadCount}</span>}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage || 'No messages'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600">{fmtRelative(conv.updatedAt || conv.createdAt)}</span>
                      {conv.handoffStatus === 'PENDING' && <span className="text-xs text-amber-400 flex items-center gap-0.5"><AlertTriangle size={9}/>Needs human</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex-1 glass-card flex flex-col min-w-0 overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center"><MessageSquare size={48} className="text-gray-700 mx-auto mb-3"/><p className="text-gray-400">Select a conversation</p></div>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-primary-400"/></div>
          ) : detail ? (<>
            {/* Conv header */}
            <div className="p-4 border-b border-white/8 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{CHANNEL_ICON[detail.channel] || '💬'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{detail.lead?.fullName || detail.channelIdentifier || 'Visitor'}</p>
                  <p className="text-xs text-gray-400">{detail.channel.replace(/_/g,' ')} · {detail.open ? 'Active' : 'Closed'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {detail.lead && (
                  <a href={`/dashboard/leads/${detail.lead.id}`} className="btn-secondary text-xs py-1.5">View Lead</a>
                )}
                {detail.handoffStatus === 'PENDING' && (
                  <button onClick={() => handoffMutation.mutate(detail.id)} disabled={handoffMutation.isPending} className="btn-primary text-xs py-1.5">
                    <CheckCircle size={12}/> Accept Handoff
                  </button>
                )}
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {(detail.messages ?? []).length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No messages</div>
              ) : (detail.messages ?? []).map(msg => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.sender === 'STUDENT' ? '' : 'flex-row-reverse'}`}>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.sender === 'AI' ? 'bg-primary-500/20' : msg.sender === 'STUDENT' ? 'bg-gray-700' : 'bg-green-500/20'}`}>
                    {msg.sender === 'AI' ? <Bot size={13} className="text-primary-400"/> : <User size={13} className="text-gray-300"/>}
                  </div>
                  <div className={`max-w-[72%] flex flex-col gap-1 ${msg.sender === 'STUDENT' ? '' : 'items-end'}`}>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${msg.sender === 'STUDENT' ? 'bg-white/8 text-gray-200 rounded-tl-sm' : msg.sender === 'AI' ? 'bg-primary-600/20 border border-primary-500/30 text-white rounded-tr-sm' : 'bg-green-600/20 border border-green-500/30 text-white rounded-tr-sm'}`}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-xs text-gray-600">{fmtRelative(msg.createdAt)}</span>
                      {msg.aiConfidence != null && msg.sender === 'AI' && (
                        <span className={`text-xs ${msg.aiConfidence > 0.75 ? 'text-green-400' : 'text-amber-400'}`}>{Math.round(msg.aiConfidence * 100)}% confidence</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Footer */}
            <div className="p-3 border-t border-white/8">
              {detail.handoffStatus === 'PENDING' ? (
                <div className="text-center text-xs text-amber-400 py-2">⚠️ Human handoff requested — accept to reply directly</div>
              ) : (
                <div className="text-center text-xs text-gray-600 py-2">AI is handling this conversation. Accept handoff to take over.</div>
              )}
            </div>
          </>) : null}
        </div>
      </div>
    </div>
  )
}
