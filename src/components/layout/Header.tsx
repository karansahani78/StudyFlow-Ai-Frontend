import { Bell, Menu, Search, LogOut, User, Settings, CheckCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { initials, fmtRelative } from '@/utils/format'
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { logout } = useAuth()
  const { user } = useAuthStore()
  const { unreadCount, notifications, markAllRead } = useNotifications()
  const [showUser, setShowUser] = useState(false)
  const [showBell, setShowBell] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowBell(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 bg-gray-900/80 backdrop-blur-sm border-b border-white/8 flex items-center gap-4 px-6 flex-shrink-0 z-10">
      <button onClick={onMenuClick} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            placeholder="Search leads..." onKeyDown={(e) => { if (e.key === 'Enter') { const q = (e.target as HTMLInputElement).value; if (q) navigate(`/dashboard/leads?search=${encodeURIComponent(q)}`)} }} />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative" ref={bellRef}>
          <button onClick={() => { setShowBell(!showBell); setShowUser(false) }}
            className="relative p-2 text-gray-400 hover:text-white hover:bg-white/8 rounded-xl transition-colors">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showBell && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={() => markAllRead()} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-6">No notifications</p>
                ) : notifications.map((n) => (
                  <div key={n.id} className={`px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.read ? 'bg-primary-500/5' : ''}`}>
                    <p className="text-sm font-medium text-white">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">{fmtRelative(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button onClick={() => { setShowUser(!showUser); setShowBell(false) }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-colors">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
              {user ? initials(`${user.firstName} ${user.lastName}`) : 'U'}
            </div>
            <span className="text-sm font-medium text-white hidden md:block">{user?.firstName}</span>
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
                <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full mt-1 inline-block">{user?.role}</span>
              </div>
              <Link to="/dashboard/settings" onClick={() => setShowUser(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/8 transition-colors">
                <Settings size={15} /> Settings
              </Link>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut size={15} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
