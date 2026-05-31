import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

const BASE = (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach token ───────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: auto-refresh ──────────────────────────────────────
let refreshing = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ message?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && !original._retry) {
      const refresh = localStorage.getItem('refreshToken')
      if (!refresh) { localStorage.clear(); window.location.href = '/login'; return Promise.reject(error) }
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api.request(original)
        })
      }
      original._retry = true
      refreshing = true
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, null, {
          headers: { 'X-Refresh-Token': refresh },
        })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
        queue.forEach((p) => p.resolve(data.accessToken))
        queue = []
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api.request(original)
      } catch (err) {
        queue.forEach((p) => p.reject(err))
        queue = []
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally { refreshing = false }
    }
    if (error.response?.status !== 401) {
      const msg = (error.response?.data as any)?.message || error.message || 'Request failed'
      toast.error(msg)
    }
    return Promise.reject(error)
  }
)

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register:       (d: any)          => api.post('/auth/register', d),
  login:          (d: any)          => api.post('/auth/login', d),
  refresh:        (token: string)   => api.post('/auth/refresh', null, { headers: { 'X-Refresh-Token': token } }),
  logout:         ()                => api.post('/auth/logout'),
  forgotPassword: (email: string)   => api.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`),
  resetPassword:  (d: any)          => api.post('/auth/reset-password', d),
  verifyEmail:    (token: string)   => api.get(`/auth/verify-email?token=${token}`),
  changePassword: (d: any)          => api.post('/auth/change-password', d),
  me:             ()                => api.get('/auth/me'),
}

// ── Leads ────────────────────────────────────────────────────────────────────

const ngrokHeaders = {
  'ngrok-skip-browser-warning': 'true',
}

export const leadsApi = {
  list: (params?: Record<string, any>) =>
    api.get('/leads', {
      params,
      headers: ngrokHeaders,
    }),

  get: (id: string) =>
    api.get(`/leads/${id}`, {
      headers: ngrokHeaders,
    }),

  create: (d: any) =>
    api.post('/leads', d, {
      headers: ngrokHeaders,
    }),

  update: (id: string, d: any) =>
    api.put(`/leads/${id}`, d, {
      headers: ngrokHeaders,
    }),

  delete: (id: string) =>
    api.delete(`/leads/${id}`, {
      headers: ngrokHeaders,
    }),

  updateStatus: (id: string, status: string) =>
    api.patch(`/leads/${id}/status?status=${status}`, null, {
      headers: ngrokHeaders,
    }),

  assign: (id: string, cId: string) =>
    api.patch(`/leads/${id}/assign?counselorId=${cId}`, null, {
      headers: ngrokHeaders,
    }),

  qualify: (id: string) =>
    api.post(`/leads/${id}/qualify`, null, {
      headers: ngrokHeaders,
    }),

  import: (file: File, format = 'csv') => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('format', format)

    return api.post('/leads/import', fd, {
      headers: {
        ...ngrokHeaders,
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  export: (params?: Record<string, any>) =>
    api.get('/leads/export', {
      params,
      responseType: 'blob',
      headers: ngrokHeaders,
    }),
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard:   ()                          => api.get('/analytics/dashboard'),
  leads:       (from: string, to: string)  => api.get('/analytics/leads', { params: { from, to } }),
  revenue:     (from: string, to: string)  => api.get('/analytics/revenue', { params: { from, to } }),
  counselors:  ()                          => api.get('/analytics/counselors'),
  aiInsights:  ()                          => api.get('/analytics/ai-insights'),
}

// ── Appointments ─────────────────────────────────────────────────────────────
export const appointmentsApi = {
  list:         (params?: Record<string, any>) => api.get('/appointments', { params }),
  get:          (id: string)                   => api.get(`/appointments/${id}`),
  create:       (d: any)                       => api.post('/appointments', d),
  updateStatus: (id: string, status: string)   => api.patch(`/appointments/${id}/status?status=${status}`),
  delete:       (id: string)                   => api.delete(`/appointments/${id}`),
}

// ── Documents ─────────────────────────────────────────────────────────────────
export const documentsApi = {
  list: (leadId: string) => api.get(`/leads/${leadId}/documents`),
  upload: (leadId: string, file: File, type: string) => {
    const fd = new FormData(); fd.append('file', file); fd.append('type', type)
    return api.post(`/leads/${leadId}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/documents/${id}/status?status=${status}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`),
  download: (id: string) => api.get(`/documents/${id}/download`),
  delete:   (id: string) => api.delete(`/documents/${id}`),
}

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversationsApi = {
  list:    (params?: Record<string, any>) => api.get('/conversations', { params }),
  get:     (id: string)                   => api.get(`/conversations/${id}`),
  handoff: (id: string)                   => api.post(`/conversations/${id}/handoff`),
}

// ── Follow-ups ────────────────────────────────────────────────────────────────
export const followUpsApi = {
  list:     (params?: Record<string, any>) => api.get('/followups', { params }),
  create:   (d: any)                       => api.post('/followups', d),
  complete: (id: string, notes?: string)   =>
    api.patch(`/followups/${id}/complete${notes ? `?notes=${encodeURIComponent(notes)}` : ''}`),
}

// ── Notes ─────────────────────────────────────────────────────────────────────
export const notesApi = {
  list:   (leadId: string)           => api.get(`/leads/${leadId}/notes`),
  create: (leadId: string, d: any)   => api.post(`/leads/${leadId}/notes`, d),
  delete: (leadId: string, id: string) => api.delete(`/leads/${leadId}/notes/${id}`),
}

// ── Knowledge Base ────────────────────────────────────────────────────────────
export const kbApi = {
  list:   (params?: Record<string, any>) => api.get('/knowledge-base', { params }),
  create: (d: any)                       => api.post('/knowledge-base', d),
  upload: (file: File, title: string, category?: string) => {
    const fd = new FormData(); fd.append('file', file); fd.append('title', title)
    if (category) fd.append('category', category)
    return api.post('/knowledge-base/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: string) => api.delete(`/knowledge-base/${id}`),
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list:       (params?: Record<string, any>) => api.get('/users', { params }),
  counselors: ()                              => api.get('/users/counselors'),
  invite:     (d: any)                        => api.post('/admin/team/invite', d),
  update:     (id: string, d: any)            => api.patch(`/users/${id}`, d),
  deactivate: (id: string)                    => api.delete(`/users/${id}`),
}

// ── Invoices ──────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list:     (params?: Record<string, any>) => api.get('/invoices', { params }),
  create:   (d: any)                       => api.post('/invoices', d),
  markPaid: (id: string)                   => api.patch(`/invoices/${id}/mark-paid`),
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list:        (params?: Record<string, any>) => api.get('/notifications', { params }),
  unreadCount: ()                              => api.get('/notifications/unread-count'),
  markAllRead: ()                              => api.post('/notifications/mark-all-read'),
}

// ── Tenant ────────────────────────────────────────────────────────────────────
export const tenantApi = {
  get:            ()           => api.get('/tenant'),
  updateSettings: (d: any)     => api.patch('/tenant/settings', d),
}

// ── Activity ──────────────────────────────────────────────────────────────────
export const activityApi = {
  list:      (params?: Record<string, any>) => api.get('/activity', { params }),
  leadTrail: (leadId: string)               => api.get(`/activity/leads/${leadId}`),
}
