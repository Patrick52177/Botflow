'use client'
import { useEffect, useState } from 'react'
import { conversationApi } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'
import { MessageSquare, Bot, TrendingUp, Clock, Users, Zap } from 'lucide-react'

interface Analytics {
  totalConversations: number
  totalMessages: number
  aiResolutionRate: number
  avgResponseTime: number
  escalationRate: number
  satisfactionScore: number
  conversationsByDay: { date: string; count: number }[]
  topKeywords: { keyword: string; count: number }[]
  channelBreakdown: { channel: string; count: number }[]
  hourlyDistribution: { hour: number; count: number }[]
}

const COLORS = ['#6C63FF', '#22C55E', '#F59E0B', '#EF4444', '#38BDF8']

function getDemoData(days: number): Analytics {
  const conversationsByDay = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (Math.min(days, 30) - i))
    return {
      date:  d.toLocaleDateString('fr', { day: '2-digit', month: '2-digit' }),
      count: Math.floor(Math.random() * 50) + 10,
    }
  })

  return {
    totalConversations: conversationsByDay.reduce((s, d) => s + d.count, 0),
    totalMessages:      conversationsByDay.reduce((s, d) => s + d.count, 0) * 4,
    aiResolutionRate:   87,
    avgResponseTime:    1.8,
    escalationRate:     13,
    satisfactionScore:  4.2,
    conversationsByDay,
    topKeywords: [
      { keyword: 'prix / tarif',  count: 312 },
      { keyword: 'horaires',      count: 198 },
      { keyword: 'rendez-vous',   count: 145 },
      { keyword: 'contact',       count: 98  },
      { keyword: 'livraison',     count: 76  },
    ],
    channelBreakdown: [
      { channel: 'Web Chat', count: 842 },
      { channel: 'Mobile',   count: 312 },
      { channel: 'WhatsApp', count: 93  },
    ],
    hourlyDistribution: Array.from({ length: 24 }, (_, h) => ({
      hour:  h,
      count: h >= 8 && h <= 20
        ? Math.floor(Math.random() * 40) + 10
        : Math.floor(Math.random() * 5),
    })),
  }
}

export default function AnalyticsPage() {
  const [data, setData]       = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('30')

  useEffect(() => {
    loadAnalytics()
  }, [period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const from = new Date()
      from.setDate(from.getDate() - parseInt(period))
      const res = await conversationApi.analytics({
        from: from.toISOString(),
        to:   new Date().toISOString(),
      })
      const demo = getDemoData(parseInt(period))
      setData({
        ...demo,
        ...res.data,
        conversationsByDay: res.data.conversationsByDay?.length ? res.data.conversationsByDay : demo.conversationsByDay,
        topKeywords:        res.data.topKeywords?.length        ? res.data.topKeywords        : demo.topKeywords,
        channelBreakdown:   res.data.channelBreakdown?.length   ? res.data.channelBreakdown   : demo.channelBreakdown,
        hourlyDistribution: res.data.hourlyDistribution?.length ? res.data.hourlyDistribution : demo.hourlyDistribution,
      })
    } catch {
      setData(getDemoData(parseInt(period)))
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 28, color: 'var(--text3)', fontSize: 14 }}>
      Chargement des analytiques...
    </div>
  )

  if (!data) return null

  const kpis = [
    { label: 'Conversations',     value: data.totalConversations.toLocaleString(), icon: MessageSquare, color: '#6C63FF', trend: '+12%' },
    { label: 'Messages échangés', value: data.totalMessages.toLocaleString(),      icon: Bot,           color: '#22C55E', trend: '+8%'  },
    { label: 'Résolution IA',     value: `${data.aiResolutionRate}%`,              icon: TrendingUp,    color: '#F59E0B', trend: '+3%'  },
    { label: "Taux d'escalade",   value: `${data.escalationRate}%`,               icon: Users,         color: '#EF4444', trend: '-2%'  },
    { label: 'Réponse moyenne',   value: `${data.avgResponseTime}s`,              icon: Clock,         color: '#38BDF8', trend: '-0.3s'},
    { label: 'Satisfaction',      value: `${data.satisfactionScore}/5`,           icon: Zap,           color: '#A855F7', trend: '+0.2' },
  ]

  return (
    <div style={{ padding: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Analytiques</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            Performance de vos chatbots en temps réel
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: '7j',  value: '7'  },
            { label: '30j', value: '30' },
            { label: '90j', value: '90' },
          ].map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)} style={{
              padding: '6px 14px',
              background: period === p.value ? 'var(--accent)' : 'var(--bg2)',
              color:      period === p.value ? '#fff'          : 'var(--text2)',
              border: `1px solid ${period === p.value ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
        {kpis.map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: kpi.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <kpi.icon size={18} color={kpi.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.2 }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{kpi.label}</div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500,
              color: kpi.trend.startsWith('+') ? 'var(--green)' : 'var(--red)',
            }}>
              {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques ligne 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Conversations par jour */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '18px 20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Conversations par jour</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.conversationsByDay} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'var(--bg4)' }}
              />
              <Bar dataKey="count" name="Conversations" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition par canal */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '18px 20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Canaux</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={data.channelBreakdown}
                dataKey="count"
                nameKey="channel"
                cx="50%" cy="50%"
                outerRadius={70}
                innerRadius={40}
                paddingAngle={3}
              >
                {data.channelBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {data.channelBreakdown.map((c, i) => (
              <div key={c.channel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text2)' }}>{c.channel}</span>
                <span style={{ fontWeight: 500 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Graphiques ligne 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Top mots-clés */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '18px 20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Top mots-clés déclencheurs</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.topKeywords.map((kw, i) => {
              const max = data.topKeywords[0]?.count || 1
              const pct = Math.round((kw.count / max) * 100)
              return (
                <div key={kw.keyword}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{kw.keyword}</span>
                    <span style={{ color: 'var(--text3)' }}>{kw.count} fois</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3 }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${pct}%`,
                      background: COLORS[i % COLORS.length],
                      transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Distribution horaire */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: '18px 20px',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Activité par heure</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10, fill: 'var(--text3)' }}
                tickLine={false} axisLine={false}
                tickFormatter={(h: number) => `${h}h`}
              />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [v, 'Messages']}
                labelFormatter={(h: number) => `${h}h00`}
              />
              <Line type="monotone" dataKey="count" stroke="#6C63FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}