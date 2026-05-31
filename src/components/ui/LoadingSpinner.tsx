import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullscreen = false, size = 'md' }: { fullscreen?: boolean; size?: 'sm'|'md'|'lg' }) {
  const s = { sm:'h-5 w-5 border-2', md:'h-8 w-8 border-2', lg:'h-12 w-12 border-[3px]' }[size]
  const spinner = (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="flex items-center justify-center">
      <div className={`${s} animate-spin rounded-full border-primary-500/30 border-t-primary-500`}/>
    </motion.div>
  )
  if (fullscreen) return <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">{spinner}</div>
  return spinner
}
