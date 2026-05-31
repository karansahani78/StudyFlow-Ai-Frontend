import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kbApi } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { BookOpen, Plus, Trash2, Upload, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import type { KnowledgeBase, Page } from '@/types'

export default function KnowledgeBasePage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: { language:'en' } })

  const { data, isLoading } = useQuery<Page<KnowledgeBase>>({
    queryKey: ['kb'],
    queryFn: () => kbApi.list({ size: 100 }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: any) => kbApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['kb']}); setShowCreate(false); reset(); toast.success('Article created — AI will use it for answers') },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => kbApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['kb']}); toast.success('Article deleted') },
  })

  const uploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const title = file.name.replace(/\.[^.]+$/, '')
    try {
      await kbApi.upload(file, title)
      qc.invalidateQueries({queryKey:['kb']})
      toast.success('Document uploaded — AI will use it for answers')
    } catch { toast.error('Upload failed') }
    e.target.value = ''
  }

  const items = (data?.content ?? []).filter(k =>
    !search || k.title.toLowerCase().includes(search.toLowerCase()) || k.content.toLowerCase().includes(search.toLowerCase())
  )

  const CATEGORIES = ['visa','fees','country','ielts','program','scholarship','process','faq','general']

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Knowledge Base</h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.totalElements ?? 0} articles · AI uses these to answer student questions</p>
        </div>
        <div className="flex gap-2">
          <label className="btn-secondary text-sm cursor-pointer">
            <Upload size={14}/>Upload PDF
            <input type="file" className="hidden" accept=".pdf,.txt,.doc,.docx" onChange={uploadPDF}/>
          </label>
          <button onClick={()=>setShowCreate(true)} className="btn-primary text-sm"><Plus size={14}/>New Article</button>
        </div>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} className="input-field pl-9 text-sm" placeholder="Search knowledge base…"/>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-400"/></div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen size={48} className="text-gray-700 mx-auto mb-3"/>
          <p className="text-gray-400 font-medium">{search ? 'No articles match your search' : 'No knowledge base articles yet'}</p>
          <p className="text-sm text-gray-500 mt-1">Add articles about visa requirements, fees, countries, IELTS, etc. to train your AI chatbot.</p>
          <button onClick={()=>setShowCreate(true)} className="btn-primary mt-4 mx-auto"><Plus size={14}/>Add First Article</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map(item => (
            <div key={item.id} className="glass-card p-5 hover:border-primary-500/20 transition-all group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.category && <span className="text-xs bg-primary-500/10 text-primary-400 border border-primary-500/20 px-2 py-0.5 rounded-full">{item.category}</span>}
                  <span className="text-xs text-gray-600">{item.language?.toUpperCase()}</span>
                </div>
                <button onClick={()=>deleteMutation.mutate(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all flex-shrink-0"><Trash2 size={13}/></button>
              </div>
              <h3 className="font-semibold text-white mb-2 line-clamp-1">{item.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{item.content}</p>
              <p className="text-xs text-gray-600 mt-3">👁 {item.viewCount} views</p>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={()=>{setShowCreate(false);reset()}} title="New Knowledge Base Article" size="lg">
        <form onSubmit={handleSubmit(d=>createMutation.mutate(d))} className="space-y-4">
          <div><label className="label">Title *</label><input {...register('title',{required:true})} className="input-field" placeholder="e.g. Canada Study Visa Requirements"/></div>
          <div>
            <label className="label">Category</label>
            <select {...register('category')} className="select-field">
              <option value="">Select category…</option>
              {CATEGORIES.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Language</label>
            <select {...register('language')} className="select-field">
              <option value="en">English</option>
              <option value="ne">Nepali</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
          <div>
            <label className="label">Content *</label>
            <textarea {...register('content',{required:true})} className="input-field min-h-[180px]" placeholder="Enter detailed content the AI will use to answer student questions…"/>
          </div>
          <div><label className="label">Tags (comma-separated)</label><input {...register('tags')} className="input-field" placeholder="canada, visa, requirements"/></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={()=>{setShowCreate(false);reset()}} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">{isSubmitting?<Loader2 size={14} className="animate-spin"/>:'Create Article'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
