import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { analyticsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { Users, TrendingUp, Calendar, AlertTriangle, MessageSquare, DollarSign, Flame, Target, ArrowUpRight, Brain, Clock } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { fmtCurrency, fmtNumber, fmtPercent } from '@/utils/format'
import type { DashboardStats } from '@/types'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16','#f97316','#64748b']

export default function DashboardHome() {
  const { user, tenant } = useAuthStore()
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
  })

  if (isLoading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({length:8}).map((_,i)=><div key={i} className="glass-card p-6 h-28 bg-white/3"/>)}
    </div>
  )

  if (error || !stats) return (
    <div className="glass-card p-8 text-center">
      <p className="text-gray-400">Failed to load dashboard. Check your connection.</p>
    </div>
  )

  const cards = [
    { label:'Total Leads',        value: fmtNumber(stats.totalLeads),           icon:Users,          color:'text-primary-400', bg:'bg-primary-500/10' },
    { label:'Hot Leads',          value: fmtNumber(stats.hotLeads),             icon:Flame,          color:'text-red-400',     bg:'bg-red-500/10'     },
    { label:'Conversion Rate',    value: fmtPercent(stats.conversionRate),       icon:Target,         color:'text-green-400',   bg:'bg-green-500/10'   },
    { label:'Total Revenue',      value: fmtCurrency(stats.totalRevenue, tenant?.currency || 'USD'), icon:DollarSign, color:'text-yellow-400', bg:'bg-yellow-500/10' },
    { label:'Upcoming Appts',     value: fmtNumber(stats.upcomingAppointments), icon:Calendar,       color:'text-cyan-400',    bg:'bg-cyan-500/10'    },
    { label:'Pending Follow-ups', value: fmtNumber(stats.pendingFollowUps),     icon:AlertTriangle,  color:'text-amber-400',   bg:'bg-amber-500/10'   },
    { label:'Open Conversations', value: fmtNumber(stats.openConversations),    icon:MessageSquare,  color:'text-purple-400',  bg:'bg-purple-500/10'  },
    { label:'Overdue Follow-ups', value: fmtNumber(stats.overdueFollowUps),     icon:Clock,          color:'text-rose-400',    bg:'bg-rose-500/10'    },
  ]

  const weeklyData = stats.weeklyLeads?.length
    ? stats.weeklyLeads
    : [{ date:'Mon',count:0},{ date:'Tue',count:0},{ date:'Wed',count:0},{ date:'Thu',count:0},{ date:'Fri',count:0},{ date:'Sat',count:0},{ date:'Sun',count:0}]

  const statusPie = stats.leadsByStatus?.map(s => ({ name: s.status.replace(/_/g,' '), value: Number(s.count) })) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning, {user?.firstName} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">{tenant?.name} · {new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
        </div>
        {tenant?.subscriptionStatus === 'TRIALING' && (
          <div className="glass-card px-4 py-2 border-yellow-500/30">
            <p className="text-yellow-400 text-sm font-medium">🎯 Trial active · Upgrade for full access</p>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${c.bg}`}><c.icon size={18} className={c.color}/></div>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{c.value}</p>
            <p className="text-xs text-gray-400">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Weekly Lead Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{fill:'#6b7280',fontSize:12}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:'#6b7280',fontSize:12}} axisLine={false} tickLine={false} allowDecimals={false}/>
              <Tooltip contentStyle={{background:'#1f2937',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'white'}}/>
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#lg)" name="Leads"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Leads by Status</h3>
          {statusPie.length > 0 ? (<>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {statusPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'#1f2937',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'12px',color:'white'}}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {statusPie.slice(0,5).map((d,i)=>(
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:COLORS[i%COLORS.length]}}/>
                    <span className="text-gray-400 truncate max-w-[100px]">{d.name}</span>
                  </div>
                  <span className="text-white font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </>) : <p className="text-gray-500 text-sm text-center py-8">No data yet. Add leads to see stats.</p>}
        </div>
      </div>

      {/* Country + Source */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Top Destination Countries</h3>
          {stats.topCountries?.length ? (
            <div className="space-y-3">
              {stats.topCountries.slice(0,6).map((c,i)=>{
                const pct = stats.totalLeads > 0 ? Math.round((Number(c.count)/stats.totalLeads)*100) : 0
                return (
                  <div key={c.country || i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{c.country || 'Unknown'}</span>
                      <span className="text-gray-400">{c.count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:i*0.1,duration:0.6}}
                        className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"/>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-gray-500 text-sm text-center py-6">No country data yet</p>}
        </div>
        <div className="glass-card p-6">
          <h3 className="text-base font-semibold text-white mb-4">Lead Sources</h3>
          {stats.leadsBySource?.length ? (
            <div className="space-y-3">
              {stats.leadsBySource.slice(0,6).map((s,i)=>{
                const pct = stats.totalLeads > 0 ? Math.round((Number(s.count)/stats.totalLeads)*100) : 0
                return (
                  <div key={s.source || i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{s.source || 'Unknown'}</span>
                      <span className="text-gray-400">{s.count} · {pct}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:i*0.1,duration:0.6}}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"/>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="text-gray-500 text-sm text-center py-6">No source data yet</p>}
        </div>
      </div>
    </div>
  )
}
