'use client'
import { useEffect, useState } from 'react'
import { conversationApi } from '@/lib/api'
import type { Analytics } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const COLORS = ['var(--accent)', 'var(--green)', 'var(--amber)', 'var(--blue)']

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = new Date(Date.now() - 30 * 86400000).toISOString()
    conversationApi.analytics({ from }).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 28, color: 'var(--text3)' }}>Chargement des analytics...</div>

  const pieData = data?.channelStats.map(c => ({ name: c.channel, value: c.count })) ?? []
  const barData = data?.dailyStats.map(s => ({
    date: format(new Date(s.date), 'd MMM', { locale: fr }),
    conversations: s.conversations,
    messages: s.messages,
  })) ?? []

  const metrics = [
    { label: 'Conversations totales', value: data?.totalConversations ?? 0, delta: '+23%', color: 'var(--accent)' },
    { label: 'Résolution IA', value: `${(data?.aiResolutionRate ?? 0).toFixed(1)}%`, delta: '+5.2%', color: 'var(--green)' },
    { label: 'Tps réponse moy.', value: `${((data?.avgResponseTimeMs ?? 0) / 1000).toFixed(1)}s`, delta: 'Excellent', color: 'var(--blue)' },
    { label: 'Satisfaction', value: `${(data?.avgSatisfactionScore ?? 0).toFixed(1)}/5`, delta: 'Stable', color: 'var(--amber)' },
  ]

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Analytiques</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>30 derniers jours</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {metrics.map(m => (
          <div key={m.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: '16px 20px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500, marginBottom: 8 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)', color: m.color }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, marginTop: 4, color: 'var(--green)' }}>↑ {m.delta}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Conversations par jour</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData}>
              <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text2)' }}
              />
              <Bar dataKey="conversations" fill="var(--accent)" radius={[3, 3, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Répartition par canal</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend formatter={(value) => <span style={{ color: 'var(--text2)', fontSize: 12 }}>{value}</span>} />
                <Tooltip contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--text3)', fontSize: 13, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Pas de données
            </div>
          )}
        </div>
      </div>

      {/* AI vs Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Top intentions détectées</div>
          {data?.topIntents?.length ? data.topIntents.map(intent => (
            <div key={intent.intent} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 5 }}>
                <span>{intent.intent}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{intent.count} · {intent.percentage.toFixed(0)}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3 }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'var(--accent)', width: `${intent.percentage}%` }} />
              </div>
            </div>
          )) : (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Intentions disponibles après 100+ conversations</div>
          )}
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>IA vs Règles prédéfinies</div>
          {[
            { label: 'Réponses IA', value: data?.aiMessages ?? 0, total: data?.totalMessages ?? 1, color: 'var(--accent)' },
            { label: 'Règles FAQ', value: (data?.totalMessages ?? 0) - (data?.aiMessages ?? 0), total: data?.totalMessages ?? 1, color: 'var(--green)' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: item.color + '20', border: `2px solid ${item.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 600, color: item.color, fontFamily: 'var(--font-mono)', flexShrink: 0,
              }}>
                {item.total > 0 ? Math.round(item.value / item.total * 100) : 0}%
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{item.value} messages</div>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--text2)' }}>
            Taux d'escalade : <strong style={{ color: 'var(--amber)' }}>
              {data && data.totalConversations > 0
                ? ((data.escalatedConversations / data.totalConversations) * 100).toFixed(1)
                : 0}%
            </strong>
          </div>
        </div>
      </div>
    </div>
  )
}
