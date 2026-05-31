import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { AuthResponse } from '@/types'

export function useAuth() {
  const {
    user,
    tenant,
    isAuthenticated,
    setAuth,
    logout: storeLogout,
  } = useAuthStore()

  const navigate = useNavigate()

  const login = async (
    email: string,
    password: string,
    tenantSlug: string
  ) => {
    const response = await authApi.login({
      email,
      password,
      tenantSlug,
    })

    const r: AuthResponse = response.data.data

    setAuth(
      r.user,
      r.tenant,
      r.accessToken,
      r.refreshToken
    )

    toast.success(`Welcome back, ${r.user.firstName}!`)
    navigate('/dashboard')

    return r
  }

  const register = async (payload: any) => {
    const response = await authApi.register(payload)

    const r: AuthResponse = response.data.data

    setAuth(
      r.user,
      r.tenant,
      r.accessToken,
      r.refreshToken
    )

    toast.success('Account created! Welcome to StudyFlow AI 🎓')
    navigate('/dashboard')

    return r
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }

    storeLogout()
    localStorage.clear()
    navigate('/login')
    toast.success('Logged out')
  }

  return {
    user,
    tenant,
    isAuthenticated,
    login,
    register,
    logout,
  }
}