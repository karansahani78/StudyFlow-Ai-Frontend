import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { authApi } from '@/services/api'
import { Zap, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success('Reset email sent!')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]"/>
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-glow">
            <Zap size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{sent ? 'Check your email' : 'Forgot password?'}</h1>
          <p className="text-gray-400 mt-1 text-sm">{sent ? `We sent a reset link to ${email}` : 'Enter your email and we'll send a reset link'}</p>
        </div>
        <div className="glass-card p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="text-green-400 mx-auto" />
              <p className="text-sm text-gray-300">Check your inbox and click the reset link.</p>
              <Link to="/login" className="btn-secondary w-full justify-center">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" autoComplete="email"/>
              </div>
              <button type="submit" disabled={loading || !email} className="btn-primary w-full justify-center py-3">
                {loading ? <Loader2 size={17} className="animate-spin"/> : 'Send reset link'}
              </button>
            </form>
          )}
          <Link to="/login" className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14}/> Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
