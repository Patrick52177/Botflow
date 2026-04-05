'use client'
import { useEffect, useState, useRef } from 'react'
import { conversationApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useChatHub } from '@/hooks/useChatHub'
import type { Conversation, Message } from '@/types'
import { Send, UserCheck, CheckCircle } from 'lucide-react'

export default function ConversationsPage() {
  const { user, tenant } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load conversations list
  useEffect(() => {
    conversationApi.list({ pageSize: 30 })
      .then(r => setConversations(r.data.items))
      .finally(() => setLoading(false))
  }, [])

  // Load messages when selecting a conversation
  useEffect(() => {
    if (!selected) return
    conversationApi.get(selected.id).then(r => {
      // The full conversation with messages is in r.data
      // For now we seed from the last message
      setMessages([])
    })
  }, [selected])

  // SignalR integration
  const { connected, agentSendMessage } = useChatHub({
    conversationId: selected?.id ?? null,
    tenantId:       tenant?.id ?? '',
    chatbotId:      selected?.chatbotId ?? '',
    onMessage:      (msg) => setMessages(prev => [...prev, msg]),
    onBotTyping:    (isTyping) => setBotTyping(isTyping),
    onEscalated:    () => {
      if (selected) {
        setConversations(prev => prev.map(c =>
          c.id === selected.id ? { ...c, status: 'escalated' } : c))
      }
    },
  })

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, botTyping])

  const sendAgentMessage = async () => {
    if (!input.trim() || !selected) return
    await agentSendMessage(input.trim())
    setInput('')
  }

  const escalate = async (id: string) => {
    await conversationApi.escalate(id, user?.id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'escalated' } : c))
  }

  const resolve = async (id: string) => {
    await conversationApi.resolve(id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c))
    if (selected?.id === id) setSelected(null)
  }

  const statusColors: Record<string, string> = {
    active: 'var(--green)', escalated: 'var(--amber)', resolved: 'var(--text3)', abandoned: 'var(--red)',
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Conversations</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''} chargées
        </p>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '280px 1fr', gap: 0,
        border: '1px solid var(--border)', borderRadius: 'var(--r2)',
        overflow: 'hidden', height: 'calc(100vh - 180px)',
      }}>
        {/* List */}
        <div style={{ background: 'var(--bg2)', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="text" placeholder="Rechercher..."
              style={{
                width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '7px 10px', fontSize: 12, color: 'var(--text)',
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
          {loading ? (
            <div style={{ padding: 16, color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
          ) : conversations.map(c => (
            <div key={c.id}
              onClick={() => setSelected(c)}
              style={{
                padding: '12px 14px', cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                background: selected?.id === c.id ? 'var(--bg4)' : 'transparent',
                transition: 'background .12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--bg4)',
                  border: '1px solid var(--border2)', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 11, flexShrink: 0,
                }}>
                  {(c.visitorName ?? 'V').slice(0, 1).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>
                  {c.visitorName ?? 'Visiteur'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                  {new Date(c.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {c.lastMessage?.content ?? 'Aucun message'}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 10,
                  background: statusColors[c.status] + '20',
                  color: statusColors[c.status], fontWeight: 600,
                }}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chat area */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
            {/* Header */}
            <div style={{
              padding: '14px 18px', borderBottom: '1px solid var(--border)',
              background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg,var(--accent),#a855f7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                }}>{(selected.visitorName ?? 'V').slice(0, 2).toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{selected.visitorName ?? 'Visiteur'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    via {selected.channel} · {connected ? <span style={{ color: 'var(--green)' }}>Connecté</span> : 'Déconnecté'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {selected.status === 'active' && (
                  <button onClick={() => escalate(selected.id)} style={actionBtnStyle}>
                    <UserCheck size={13} /> Prendre en charge
                  </button>
                )}
                {selected.status !== 'resolved' && (
                  <button onClick={() => resolve(selected.id)} style={{ ...actionBtnStyle, color: 'var(--green)' }}>
                    <CheckCircle size={13} /> Résoudre
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', margin: '8px 0' }}>
                Conversation démarrée le {new Date(selected.createdAt).toLocaleDateString('fr')}
              </div>
              {messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.isAiGenerated && (
                    <span style={{
                      fontSize: 9, background: 'var(--accent-bg)', color: 'var(--accent2)',
                      padding: '2px 6px', borderRadius: 8, marginBottom: 3,
                      fontFamily: 'var(--font-mono)', fontWeight: 600,
                    }}>IA • {msg.aiProvider}</span>
                  )}
                  <div style={{
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 14, fontSize: 13, lineHeight: 1.55,
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text)',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  }}>
                    {msg.content}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                    {new Date(msg.createdAt).toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {botTyping && (
                <div style={{
                  alignSelf: 'flex-start', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 14, padding: '10px 14px', fontSize: 13, color: 'var(--text3)',
                }}>...</div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '12px 16px', borderTop: '1px solid var(--border)',
              background: 'var(--bg2)', display: 'flex', gap: 8,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAgentMessage()}
                placeholder="Répondre en tant qu'agent..."
                style={{
                  flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 12px', fontSize: 13,
                  color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
                }}
              />
              <button onClick={sendAgentMessage} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '0 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
                <Send size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  )
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  background: 'var(--bg3)', color: 'var(--text2)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '6px 12px', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
}
