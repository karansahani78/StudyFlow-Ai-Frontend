import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client: Client | null = null

export function connectWebSocket(tenantId: string, onMessage: (msg: any) => void) {
    const token = localStorage.getItem('accessToken')
    client = new Client({
        webSocketFactory: () => new SockJS('/api/ws'),
        connectHeaders: { Authorization: `Bearer ${token}` },
        onConnect: () => {
            client?.subscribe(`/topic/tenant/${tenantId}/conversations`, (msg) => {
                try { onMessage(JSON.parse(msg.body)) } catch {}
            })
            client?.subscribe(`/user/queue/notifications`, (msg) => {
                try { onMessage(JSON.parse(msg.body)) } catch {}
            })
        },
        reconnectDelay: 5000,
    })
    client.activate()
    return () => client?.deactivate()
}

export function disconnectWebSocket() { client?.deactivate() }
