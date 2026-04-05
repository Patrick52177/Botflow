'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import * as signalR from '@microsoft/signalr'
import type { Message } from '@/types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:5000'

interface UseChatHubOptions {
  conversationId: string | null
  tenantId: string
  chatbotId: string
  onMessage:  (msg: Message) => void
  onBotTyping: (isTyping: boolean) => void
  onEscalated?: () => void
  onResolved?:  () => void
  onError?:     (err: string) => void
}

export function useChatHub({
  conversationId,
  tenantId,
  chatbotId,
  onMessage,
  onBotTyping,
  onEscalated,
  onResolved,
  onError,
}: UseChatHubOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const [connected, setConnected] = useState(false)

  // Build and start the connection
  useEffect(() => {
    if (!conversationId) return

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken') ?? ''
      : ''

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${WS_URL}/hubs/chat`, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    // ── Event listeners ────────────────────────────────────────────────────
    connection.on('MessageReceived', onMessage)
    connection.on('BotTyping',       (_convId: string, isTyping: boolean) => onBotTyping(isTyping))
    connection.on('ConversationEscalated', () => onEscalated?.())
    connection.on('ConversationResolved',  () => onResolved?.())
    connection.on('Error',           (err: string) => onError?.(err))

    connection.onreconnecting(() => setConnected(false))
    connection.onreconnected(async () => {
      setConnected(true)
      await connection.invoke('JoinConversation', conversationId)
    })
    connection.onclose(() => setConnected(false))

    // Start and join the conversation room
    connection.start().then(async () => {
      setConnected(true)
      await connection.invoke('JoinConversation', conversationId)
    }).catch(err => {
      console.error('SignalR connection error:', err)
      onError?.('Connection failed')
    })

    connectionRef.current = connection

    return () => {
      connection.stop()
      connectionRef.current = null
      setConnected(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  // ── Send message via WebSocket ───────────────────────────────────────────
  const sendMessage = useCallback(async (content: string) => {
    const conn = connectionRef.current
    if (!conn || conn.state !== signalR.HubConnectionState.Connected || !conversationId) return
    await conn.invoke('SendMessage', conversationId, tenantId, chatbotId, content)
  }, [conversationId, tenantId, chatbotId])

  // ── Agent reply ──────────────────────────────────────────────────────────
  const agentSendMessage = useCallback(async (content: string) => {
    const conn = connectionRef.current
    if (!conn || conn.state !== signalR.HubConnectionState.Connected || !conversationId) return
    await conn.invoke('AgentSendMessage', conversationId, tenantId, content)
  }, [conversationId, tenantId])

  // ── Typing indicator ─────────────────────────────────────────────────────
  const sendTyping = useCallback(async (isTyping: boolean) => {
    const conn = connectionRef.current
    if (!conn || !conversationId) return
    await conn.invoke('TypingIndicator', conversationId, isTyping)
  }, [conversationId])

  return { connected, sendMessage, agentSendMessage, sendTyping }
}
