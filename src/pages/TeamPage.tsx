import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/services/api'
import { Modal } from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Badge } from '@/components/ui/Badge'
import { UserPlus, Loader2 } from 'lucide-react'
import { fmtDate, initials, fmtRelative } from '@/utils/format'
import toast from 'react-hot-toast'
import type { User, Page } from '@/types'

const schema = z.object({
  firstName: z.string().min(1,'Required'),
  lastName:  z.string().optional(),
  email:     z.string().email('Invalid email'),
  role:      z.string().min(1,'Required'),
})
type F = z.infer<typeof schema>

const ROLES = ['COUNSELOR','DOCUMENT_OFFICER','FINANCE_STAFF','MARKETING_TEAM','ADMIN']
const ROLE_DESC: Record<string, string> = {
  COUNSELOR:'Manages student leads and counseling',
  DOCUMENT_OFFICER:'Reviews and approves documents',
  FINANCE_STAFF:'Manages invoices and payments',
  MARKETING_TEAM:'View-only analytics access',
  ADMIN:'Full access except billing',
}

export default function TeamPage() {
  const qc = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { role:'COUNSELOR' } })

  const { data, isLoading } = useQuery<Page<User>>({
    queryKey: ['team'],
    queryFn: () => usersApi.list({ size: 50 }).then(r => r.data),
  })

  const inviteMutation = useMutation({
    mutationFn: (d: F) => usersApi.invite(d),
    onSuccess: () => { qc.invalidateQueries({queryKey:['team']}); setShowInvite(false); reset(); toast.success('Invitation sent!') },
  })
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({queryKey:['team']}); toast.success('User deactivated') },
    onError: () => toast.error('Failed to deactivate'),
  })

  const users = data?.content ?? []

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} members</p>
        </div>
        <button onClick={()=>setShowInvite(true)} className="btn-primary"><UserPlus size={15}/>Invite Member</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-primary-400"/></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Member','Role','Status','Last Login','Joined',''].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-500">No team members yet</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-500/30 to-purple-500/30 rounded-xl flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                        {initials(`${user.firstName} ${user.lastName}`)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge value={user.role}/></td>
                  <td className="px-4 py-3"><Badge value={user.status}/></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{user.lastLoginAt ? fmtRelative(user.lastLoginAt) : 'Never'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    {user.role !== 'OWNER' && user.status === 'ACTIVE' && (
                      <button onClick={()=>{ if (confirm(`Deactivate ${user.firstName}?`)) deactivateMutation.mutate(user.id) }} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Deactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showInvite} onClose={()=>{setShowInvite(false);reset()}} title="Invite Team Member">
        <form onSubmit={handleSubmit(d=>inviteMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name *</label><input {...register('firstName')} className="input-field" placeholder="Jane"/>{errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}</div>
            <div><label className="label">Last Name</label><input {...register('lastName')} className="input-field" placeholder="Doe"/></div>
          </div>
          <div><label className="label">Email *</label><input {...register('email')} type="email" className="input-field" placeholder="jane@consultancy.com"/>{errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}</div>
          <div>
            <label className="label">Role *</label>
            <select {...register('role')} className="select-field">
              {ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g,' ')}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">{ROLE_DESC[Object.keys(ROLE_DESC)[0]]}</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={()=>{setShowInvite(false);reset()}} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 justify-center">{isSubmitting?<Loader2 size={14} className="animate-spin"/>:'Send Invite'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
