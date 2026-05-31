import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid } from 'recharts'
import { fmtCurrency, fmtPercent, fmtNumber } from '@/utils/format'
import { Brain, TrendingUp, Users, DollarSign, Loader2 } from 'lucide-react'
import type { DashboardStats } from '@/types'
import { format, subDays } from 'date-fns'

const COLORS = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#84cc16']

const TT = { contentStyle: { background:'#1f2937', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', color:'white' } }

export default function AnalyticsPage() {
  const { tenant } = useAuthStore()
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard().then(r => r.data),
  })
  const { data: insights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => analyticsApi.aiInsights().then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-primary-400"/></div>
  if (!stats) return <div className="text-center py-24 text-gray-400">No analytics data yet. Add leads to get started.</div>

  const currency = tenant?.currency || 'USD'
  const kpis = [
    { label:'Total Leads',     value: fmtNumber(stats.totalLeads),          icon:Users,      color:'text-primary-400', bg:'bg-primary-500/10' },
    { label:'Conversion Rate', value: fmtPercent(stats.conversionRate),      icon:TrendingUp, color:'text-green-400',   bg:'bg-green-500/10'   },
    { label:'Total Revenue',   value: fmtCurrency(stats.totalRevenue, currency), icon:DollarSign, color:'text-yellow-400', bg:'bg-yellow-500/10' },
    { label:'Hot Leads',       value: fmtNumber(stats.hotLeads),             icon:Brain,      color:'text-red-400',     bg:'bg-red-500/10'     },
  ]

  const statusData   = (stats.leadsByStatus ?? []).map(s => ({ name: s.status.replace(/_/g,' '), count: Number(s.count) }))
  const sourceData   = (stats.leadsBySource ?? []).map(s => ({ name: s.source?.replace(/_/g,' ') || 'Unknown', value: Number(s.count) }))
  const countryData  = (stats.topCountries ?? []).slice(0,8).map(c => ({ name: c.country || 'Unknown', count: Number(c.count) }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="text-sm text-gray-400 mt-0.5">Insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(c => (
          <div key={c.label} className="stat-card">
            <div className={`p-2.5 ${c.bg} rounded-xl w-fit mb-3`}><c.icon size={17} className={c.color}/></div>
            <p className="text-2xl font-bold text-white">{c.value}</p>
            <p className="text-xs text-gray-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Leads by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
                <XAxis dataKey="name" tick={{ fill:'#6b7280', fontSize:9 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={55}/>
                <YAxis tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip {...TT}/>
                <Bar dataKey="count" fill="#6366f1" radius={[5,5,0,0]} name="Leads"/>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-sm text-center py-10">No data yet</p>}
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title mb-4">Lead Sources</h3>
          {sourceData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value">
                    {sourceData.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip {...TT}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1.5">
                {sourceData.slice(0,6).map((d,i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:COLORS[i%COLORS.length] }}/>
                    <span className="text-gray-400 truncate flex-1">{d.name}</span>
                    <span className="text-white font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-gray-500 text-sm text-center py-10">No source data yet</p>}
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="section-title mb-4">Top Countries</h3>
        {countryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={countryData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false}/>
              <XAxis type="number" tick={{ fill:'#6b7280', fontSize:11 }} axisLine={false} tickLine={false} allowDecimals={false}/>
              <YAxis type="category" dataKey="name" tick={{ fill:'#9ca3af', fontSize:12 }} axisLine={false} tickLine={false} width={90}/>
              <Tooltip {...TT}/>
              <Bar dataKey="count" fill="#8b5cf6" radius={[0,5,5,0]} name="Leads"/>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-gray-500 text-sm text-center py-10">No country data yet</p>}
      </div>

      {insights && (
        <div className="glass-card p-6 border-primary-500/20">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary-500/10 rounded-xl"><Brain size={18} className="text-primary-400"/></div>
            <h3 className="section-title">AI Business Insights</h3>
          </div>
          <div className="p-4 bg-primary-500/5 border border-primary-500/20 rounded-xl">
            <p className="text-gray-300 text-sm leading-relaxed">{(insights as any).aiSummary || 'Collect more leads to generate AI insights.'}</p>
          </div>
          {((insights as any).overdueFollowUpAlerts ?? []).length > 0 && (
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-xs font-semibold text-amber-400 mb-2">⚠️ Action Required</p>
              {((insights as any).overdueFollowUpAlerts as string[]).map((a,i) => <p key={i} className="text-xs text-gray-300">• {a}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
