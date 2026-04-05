'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { chatbotApi } from '@/lib/api'
import type { Chatbot } from '@/types'
import { Plus, Settings, Play, Pause, Trash2, Zap } from 'lucide-react'

export default function ChatbotsPage() {
  const [bots, setBots] = useState<Chatbot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chatbotApi.list().then(r => setBots(r.data)).finally(() => setLoading(false))
  }, [])

  const toggleStatus = async (bot: Chatbot) => {
    const newStatus = bot.status === 'live' ? 'paused' : 'live'
    await chatbotApi.setStatus(bot.id, newStatus)
    setBots(prev => prev.map(b => b.id === bot.id ? { ...b, status: newStatus } : b))
  }

  const deleteBot = async (id: string) => {
    if (!confirm('Supprimer ce chatbot ?')) return
    await chatbotApi.delete(id)
    setBots(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Chatbots</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            {bots.length} chatbot{bots.length !== 1 ? 's' : ''} dans votre espace
          </p>
        </div>
        <Link href="/chatbots/new" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <Plus size={15} /> Nouveau chatbot
          </button>
        </Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: 14 }}>Chargement...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {bots.map(bot => (
            <div key={bot.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r2)', padding: 18, transition: 'border-color .2s, transform .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--accent-bg)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>🤖</div>
                <StatusBadge status={bot.status} />
              </div>

              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{bot.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 14, minHeight: 36 }}>
                {bot.description ?? `Chatbot ${bot.channel} — ${bot.aiProvider}`}
              </div>

              <div style={{ display: 'flex', gap: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <Stat label="chats/mois" value={bot.conversationCount} />
                <Stat label="messages" value={bot.messageCount} />
                <Stat label="canal" value={bot.channel} />
              </div>

              <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <Link href={`/chatbots/${bot.id}/flow`} style={{ flex: 1, textDecoration: 'none' }}>
                  <button style={btnStyle('var(--bg3)', 'var(--text2)')}>
                    <Settings size={13} /> Éditeur
                  </button>
                </Link>
                <Link href={`/chatbots/${bot.id}/responses`} style={{ flex: 1, textDecoration: 'none' }}>
                  <button style={btnStyle('var(--bg3)', 'var(--accent2)')}>
                    <Zap size={13} /> Réponses
                  </button>
                </Link>
                <button onClick={() => toggleStatus(bot)} style={btnStyle('var(--bg3)', bot.status === 'live' ? 'var(--amber)' : 'var(--green)')}>
                  {bot.status === 'live' ? <Pause size={13} /> : <Play size={13} />}
                </button>
                <button onClick={() => deleteBot(bot.id)} style={btnStyle('var(--bg3)', 'var(--red)')}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {/* Add new */}
          <Link href="/chatbots/new" style={{ textDecoration: 'none' }}>
            <div style={{
              border: '1px dashed var(--border2)', borderRadius: 'var(--r2)',
              padding: 18, cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10,
              color: 'var(--text3)', transition: 'all .2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'; (e.currentTarget as HTMLElement).style.color = 'var(--text3)' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', border: '1px dashed currentColor',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={18} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Créer un chatbot</span>
              <span style={{ fontSize: 11 }}>Via templates ou de zéro</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
      <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
        {value}
      </strong>
      {label}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s: Record<string, [string, string]> = {
    live:   ['● Live',    'var(--green)'],
    draft:  ['Brouillon', 'var(--amber)'],
    paused: ['Pausé',     'var(--red)'],
  }
  const [label, color] = s[status] ?? s.draft
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
      background: color + '20', color,
    }}>{label}</span>
  )
}

const btnStyle = (bg: string, color: string): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
  background: bg, color, border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', flex: 'auto', fontFamily: 'inherit', transition: 'all .15s',
})