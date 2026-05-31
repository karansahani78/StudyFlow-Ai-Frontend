import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { Zap, Loader2, CheckCircle2 } from 'lucide-react'

const schema = z.object({
  companyName: z.string().min(2, 'Min 2 chars'),
  firstName:       z.string().min(2, 'Min 2 chars'),
  lastName:        z.string().min(1, 'Required'),
  email:           z.string().email('Invalid email'),
  password:        z.string().min(8, 'Min 8 chars'),
  country:         z.string().optional(),
  timezone:        z.string().optional(),
})
type F = z.infer<typeof schema>

const perks = ['14-day free trial', 'No credit card required', 'AI chatbot included', 'Full CRM access']

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const { register: authReg } = useAuth()
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema), defaultValues: { timezone: 'Asia/Kathmandu' } })

  const onSubmit = async (d: F) => {
    setLoading(true)
    try { await authReg(d) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]"/>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center shadow-glow">
              <Zap size={18} className="text-white"/>
            </div>
            <span className="text-xl font-bold text-white">StudyFlow AI</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 leading-tight">Start converting more<br/><span className="text-primary-400">student leads today</span></h1>
          <p className="text-gray-400 mb-8 text-sm">Join 500+ study abroad consultancies automating lead management with AI.</p>
          <div className="space-y-3">
            {perks.map(p => (
              <div key={p} className="flex items-center gap-3">
                <CheckCircle2 size={17} className="text-primary-400 flex-shrink-0"/>
                <span className="text-gray-300 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white mb-5">Create your account</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Company Name *</label>
              <input {...register('companyName')} className="input-field" placeholder="Global Pathways"/>
              {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name *</label>
                <input {...register('firstName')} className="input-field" placeholder="John"/>
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input {...register('lastName')} className="input-field" placeholder="Doe"/>
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="label">Work Email *</label>
              <input {...register('email')} type="email" autoComplete="email" className="input-field" placeholder="you@consultancy.com"/>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label">Password *</label>
              <input {...register('password')} type="password" autoComplete="new-password" className="input-field" placeholder="Min 8 characters"/>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="label">Country</label>
              <select {...register('country')} className="select-field">
                <option value="">Select country</option>
                {['Nepal','India','Bangladesh','Pakistan','Sri Lanka','Other'].map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-1">
              {loading ? <Loader2 size={17} className="animate-spin"/> : 'Start free trial →'}
            </button>
            <p className="text-center text-sm text-gray-400">Already have an account? <Link to="/login" className="text-primary-400 hover:text-primary-300">Sign in</Link></p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
