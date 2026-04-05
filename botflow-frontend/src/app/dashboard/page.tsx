'use client'
import { useEffect, useState } from 'react'
import { chatbotApi, conversationApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import type { Chatbot, Analytics } from '@/types'
import { Bot, MessageSquare, TrendingUp, Clock, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { tenant } = useAuthStore()
  const [bots, setBots] = useState<Chatbot[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [botsRes, analyticsRes] = await Promise.all([
          chatbotApi.list(),
          conversationApi.analytics({ from: new Date(Date.now() - 30 * 86400000).toISOString() }),
        ])
        setBots(botsRes.data)
        setAnalytics(analyticsRes.data)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const metrics = [
    {
      label: 'Conversations ce mois',
      value: analytics?.totalConversations ?? 0,
      delta: '+23%',
      up: true,
      icon: MessageSquare,
      color: 'var(--accent)',
    },
    {
      label: 'Résolution IA',
      value: `${analytics?.aiResolutionRate?.toFixed(1) ?? 0}%`,
      delta: '+5.2%',
      up: true,
      icon: TrendingUp,
      color: 'var(--green)',
    },
    {
      label: 'Chatbots actifs',
      value: bots.filter(b => b.status === 'live').length,
      delta: `${bots.length} total`,
      up: true,
      icon: Bot,
      color: 'var(--blue)',
    },
    {
      label: 'Tps de réponse moy.',
      value: `${((analytics?.avgResponseTimeMs ?? 1300) / 1000).toFixed(1)}s`,
      delta: 'Excellent',
      up: true,
      icon: Clock,
      color: 'var(--amber)',
    },
  ]

  return (
    <div style={{ padding: 28 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Bonjour 👋
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          {tenant?.name} — Tableau de bord
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500 }}>
                {m.label}
              </span>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: m.color + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <m.icon size={14} color={m.color} />
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {loading ? '—' : m.value}
            </div>
            <div style={{ fontSize: 11, marginTop: 4, color: m.up ? 'var(--green)' : 'var(--red)' }}>
              {m.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Bots grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Mes Chatbots</span>
            <Link href="/chatbots" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'var(--accent2)', textDecoration: 'none', fontSize: 12,
            }}>
              Voir tout <ArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
          ) : bots.length === 0 ? (
            <Link href="/chatbots/new" style={{ textDecoration: 'none' }}>
              <div style={{
                border: '1px dashed var(--border2)', borderRadius: 10,
                padding: 24, textAlign: 'center', cursor: 'pointer', color: 'var(--text3)',
              }}>
                <Plus size={24} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13 }}>Créer votre premier chatbot</div>
              </div>
            </Link>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bots.slice(0, 4).map(bot => (
                <Link key={bot.id} href={`/chatbots/${bot.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                    background: 'var(--bg3)', borderRadius: 8, cursor: 'pointer',
                    border: '1px solid transparent', transition: 'border-color .15s',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'var(--accent-bg)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 16, flexShrink: 0,
                    }}>🤖</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {bot.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {bot.conversationCount} conversations
                      </div>
                    </div>
                    <StatusBadge status={bot.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Canaux de distribution</span>
          </div>
          {analytics?.channelStats?.map(ch => (
            <div key={ch.channel} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>
                <span style={{ textTransform: 'capitalize' }}>{ch.channel}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {ch.count} · {ch.percentage.toFixed(0)}%
                </span>
              </div>
              <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: ch.channel === 'webchat' ? 'var(--accent)' : ch.channel === 'whatsapp' ? 'var(--green)' : 'var(--amber)',
                  width: `${ch.percentage}%`, transition: 'width .6s',
                }} />
              </div>
            </div>
          ))}
          {!analytics?.channelStats?.length && (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>
              Aucune donnée disponible pour la période sélectionnée.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    live:   { label: '● Live',     color: 'var(--green)', bg: 'var(--green-bg)' },
    draft:  { label: 'Brouillon',  color: 'var(--amber)', bg: 'var(--amber-bg)' },
    paused: { label: 'Pausé',      color: 'var(--red)',   bg: 'var(--red-bg)'   },
  }
  const s = map[status] ?? map.draft
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  )
}
