import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import type { Notification, Page } from '@/types'

export function useNotifications() {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ['notifications-count'],
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data as number),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })

  const { data: page } = useQuery<Page<Notification>>({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ size: 20 }).then((r) => r.data),
    enabled: isAuthenticated,
  })

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications-count'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    unreadCount,
    notifications: page?.content ?? [],
    markAllRead: markAllRead.mutate,
  }
}
