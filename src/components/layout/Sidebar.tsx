import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Kanban, MessageSquare, Calendar,
  FileText, BarChart2, Bell, Receipt, BookOpen, Settings,
  UserCog, ChevronLeft, Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const NAV = [
  { to:'/dashboard',                 icon:LayoutDashboard, label:'Dashboard', end:true  },
  { to:'/dashboard/leads',           icon:Users,           label:'Leads'               },
  { to:'/dashboard/kanban',          icon:Kanban,          label:'Pipeline'             },
  { to:'/dashboard/inbox',           icon:MessageSquare,   label:'Inbox'                },
  { to:'/dashboard/appointments',    icon:Calendar,        label:'Appointments'         },
  { to:'/dashboard/followups',       icon:Bell,            label:'Follow-ups'           },
  { to:'/dashboard/documents',       icon:FileText,        label:'Documents'            },
  { to:'/dashboard/invoices',        icon:Receipt,         label:'Invoices'             },
  { to:'/dashboard/analytics',       icon:BarChart2,       label:'Analytics'            },
  { to:'/dashboard/knowledge-base',  icon:BookOpen,        label:'Knowledge Base'       },
  { to:'/dashboard/team',            icon:UserCog,         label:'Team'                 },
  { to:'/dashboard/settings',        icon:Settings,        label:'Settings'             },
]

export default function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { tenant } = useAuthStore()

  return (
    <motion.aside
      animate={{ width: open ? 240 : 68 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full bg-gray-900 border-r border-white/8 flex flex-col overflow-hidden flex-shrink-0 z-20"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-3.5 border-b border-white/8 gap-3 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
          <Zap size={17} className="text-white"/>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} className="overflow-hidden flex-1 min-w-0">
              <p className="font-bold text-white text-sm leading-none truncate">{tenant?.chatbotName || 'StudyFlow AI'}</p>
              <p className="text-xs text-primary-400 mt-0.5">AI Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={onToggle}
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="ml-auto p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        >
          <ChevronLeft size={15}/>
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 group w-full',
              isActive
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/25'
                : 'text-gray-400 hover:text-white hover:bg-white/8 border border-transparent'
            )}>
            {({ isActive }) => (
              <>
                <Icon size={17} className={cn('flex-shrink-0 transition-colors', isActive ? 'text-primary-400' : 'text-gray-500 group-hover:text-white')}/>
                <AnimatePresence>
                  {open && (
                    <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}}
                      className="overflow-hidden whitespace-nowrap text-sm">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Plan badge */}
      <AnimatePresence>
        {open && tenant && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="p-3 border-t border-white/8 flex-shrink-0">
            <div className="glass-card px-3 py-2 text-center">
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                tenant.subscriptionPlan === 'PRO'        ? 'bg-purple-500/20 text-purple-400' :
                tenant.subscriptionPlan === 'GROWTH'     ? 'bg-primary-500/20 text-primary-400' :
                tenant.subscriptionPlan === 'ENTERPRISE' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              )}>
                {tenant.subscriptionPlan}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
