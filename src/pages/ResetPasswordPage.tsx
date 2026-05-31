import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authApi } from '@/services/api'
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      await authApi.resetPassword({ token, newPassword: password })
      toast.success('Password reset successfully!')
      navigate('/login')
    } finally { setLoading(false) }
  }

  if (!token) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center"><p className="text-red-400 mb-4">Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="btn-primary">Request new link</Link></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]"/>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-glow">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set new password</h1>
        </div>
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">New password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} className="input-field pr-10" placeholder="Min 8 characters" autoComplete="new-password"/>
                <button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {show ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading || password.length < 8} className="btn-primary w-full justify-center py-3">
              {loading ? <Loader2 size={17} className="animate-spin"/> : 'Reset password'}
            </button>
          </form>
          <Link to="/login" className="block text-center mt-4 text-sm text-gray-400 hover:text-white">Back to login</Link>
        </div>
      </motion.div>
    </div>
  )
}
