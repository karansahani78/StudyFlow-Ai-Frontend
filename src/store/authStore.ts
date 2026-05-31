import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Tenant } from '@/types'

interface AuthState {
  user: User | null
  tenant: Tenant | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, tenant: Tenant, at: string, rt: string) => void
  updateUser: (u: Partial<User>) => void
  updateTenant: (t: Partial<Tenant>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tenant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, tenant, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true })
      },

      updateUser: (update) =>
        set((s) => ({ user: s.user ? { ...s.user, ...update } : null })),

      updateTenant: (update) =>
        set((s) => ({ tenant: s.tenant ? { ...s.tenant, ...update } : null })),

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, tenant: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },
    }),
    {
      name: 'studyflow-auth',
      partialize: (s) => ({
        user: s.user,
        tenant: s.tenant,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)
