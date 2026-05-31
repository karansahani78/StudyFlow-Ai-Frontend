import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi, leadsApi } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Receipt, Trash2, Loader2, CheckCircle } from 'lucide-react'
import { fmtCurrency, fmtDate } from '@/utils/format'
import toast from 'react-hot-toast'
import type { Invoice, Page, Lead } from '@/types'

const lineSchema = z.object({ description: z.string().min(1), quantity: z.number().int().min(1), unitPrice: z.number().min(0) })
const schema = z.object({
  leadId: z.string().min(1,'Required'),
  lineItems: z.array(lineSchema).min(1),
  taxRate: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().optional(),
})
type F = z.infer<typeof schema>

export default function InvoicesPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const { register, control, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { lineItems: [{ description:'', quantity:1, unitPrice:0 }], currency:'USD', taxRate:0, discountAmount:0 },
  })
  const { fields, append, remove } = useFieldArray({ control, name:'lineItems' })
  const watchedItems = watch('lineItems') ?? []
  const taxRate = watch('taxRate') ?? 0
  const discount = watch('discountAmount') ?? 0
  const subtotal = watchedItems.reduce((s,i) => s + (i.quantity||0) * (i.unitPrice||0), 0)
  const total = subtotal + subtotal*(taxRate/100) - discount

  const { data, isLoading } = useQuery<Page<Invoice>>({
    queryKey:['invoices'],
    queryFn: () => invoicesApi.list({ size:50, sort:'createdAt', direction:'DESC' }).then(r=>r.data),
  })
  const { data: leadsData } = useQuery<Page<Lead>>({
    queryKey:['leads-select'],
    queryFn: () => leadsApi.list({ size:200 }).then(r=>r.data),
    enabled: showCreate,
  })

  const createMutation = useMutation({
    mutationFn: (d: F) => invoicesApi.create(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['invoices']}); setShowCreate(false); reset(); toast.success('Invoice created') },
  })
  const markPaidMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.markPaid(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['invoices']}); toast.success('Marked as paid') },
  })

  const invoices = data?.content ?? []
  const totalRevenue = invoices.filter(i=>i.status==='PAID').reduce((s,i)=>s+i.total,0)

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">{invoices.length} invoices · {fmtCurrency(totalRevenue)} collected</p>
        </div>
        <button onClick={()=>setShowCreate(true)} className="btn-primary"><Plus size={15}/>New Invoice</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-400"/></div>
      ) : (
        <div className="glass-card overflow-hidden">
          {invoices.length === 0 ? (
            <div className="p-12 text-center"><Receipt size={48} className="text-gray-700 mx-auto mb-3"/><p className="text-gray-400">No invoices yet</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Invoice #','Lead','Amount','Status','Due Date',''].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary-400">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-300 text-xs">{(inv as any).lead?.fullName || '—'}</td>
                    <td className="px-4 py-3 text-white font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td className="px-4 py-3"><Badge value={inv.status}/></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      {inv.status !== 'PAID' && (
                        <button onClick={()=>markPaidMutation.mutate(inv.id)} disabled={markPaidMutation.isPending} className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg hover:bg-green-500/20 transition-colors">
                          <CheckCircle size={11}/> Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={()=>{setShowCreate(false);reset()}} title="Create Invoice" size="lg">
        <form onSubmit={handleSubmit(d=>createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Lead *</label>
            <select {...register('leadId')} className="select-field">
              <option value="">Select lead…</option>
              {(leadsData?.content??[]).map(l=><option key={l.id} value={l.id}>{l.fullName||l.firstName}</option>)}
            </select>
            {errors.leadId && <p className="text-red-400 text-xs mt-1">{errors.leadId.message}</p>}
          </div>
          <div>
            <label className="label">Line Items</label>
            <div className="space-y-2">
              {fields.map((field,i)=>(
                <div key={field.id} className="flex gap-2 items-start">
                  <input {...register(`lineItems.${i}.description`)} className="input-field flex-1 text-sm" placeholder="Service description"/>
                  <input {...register(`lineItems.${i}.quantity`,{valueAsNumber:true})} type="number" min="1" className="input-field w-16 text-sm" placeholder="Qty"/>
                  <input {...register(`lineItems.${i}.unitPrice`,{valueAsNumber:true})} type="number" min="0" step="0.01" className="input-field w-24 text-sm" placeholder="Price"/>
                  {fields.length>1 && <button type="button" onClick={()=>remove(i)} className="p-2 text-gray-500 hover:text-red-400 mt-0.5"><Trash2 size={13}/></button>}
                </div>
              ))}
              <button type="button" onClick={()=>append({description:'',quantity:1,unitPrice:0})} className="text-xs text-primary-400 hover:text-primary-300">+ Add line item</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Tax %</label><input {...register('taxRate',{valueAsNumber:true})} type="number" min="0" max="100" step="0.1" className="input-field" placeholder="0"/></div>
            <div><label className="label">Discount</label><input {...register('discountAmount',{valueAsNumber:true})} type="number" min="0" step="0.01" className="input-field" placeholder="0"/></div>
            <div>
              <label className="label">Currency</label>
              <select {...register('currency')} className="select-field">
                <option>USD</option><option>NPR</option><option>INR</option><option>GBP</option><option>AUD</option>
              </select>
            </div>
          </div>
          {subtotal > 0 && (
            <div className="bg-white/3 rounded-xl p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{fmtCurrency(subtotal)}</span></div>
              {taxRate>0 && <div className="flex justify-between text-gray-400"><span>Tax ({taxRate}%)</span><span>{fmtCurrency(subtotal*taxRate/100)}</span></div>}
              {discount>0 && <div className="flex justify-between text-gray-400"><span>Discount</span><span>-{fmtCurrency(discount)}</span></div>}
              <div className="flex justify-between text-white font-semibold border-t border-white/10 pt-1 mt-1"><span>Total</span><span>{fmtCurrency(Math.max(0,total))}</span></div>
            </div>
          )}
          <div><label className="label">Due Date</label><input {...register('dueDate')} type="date" className="input-field"/></div>
          <div><label className="label">Notes</label><textarea {...register('notes')} className="input-field min-h-[60px]"/></div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={()=>{setShowCreate(false);reset()}} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">{isSubmitting?<Loader2 size={14} className="animate-spin"/>:'Create Invoice'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
