'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import { Bot, MessageSquare, BarChart2, Puzzle, 
  Settings, LogOut, Home, ChevronDown, Users } from 'lucide-react'

const navItems = [
  { href: '/dashboard',       icon: Home,          label: 'Vue d\'ensemble' },
  { href: '/users', icon: Users, label: 'Équipe' },
  { href: '/chatbots',        icon: Bot,           label: 'Chatbots' },
  { href: '/conversations',   icon: MessageSquare, label: 'Conversations' },
  { href: '/analytics',       icon: BarChart2,     label: 'Analytiques' },
  { href: '/integration',     icon: Puzzle,        label: 'Intégration' },
  { href: '/settings',        icon: Settings,      label: 'Paramètres IA' },

]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, tenant, isAuthenticated, logout } = useAuthStore()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login')
    }
  }, [hydrated, isAuthenticated, router])

  if (!hydrated) return null
  if (!isAuthenticated || !user) return null

  const handleLogout = async () => {
    logout()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--accent)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
            }}>⚡</div>
            <span style={{ fontSize: 15, fontWeight: 600 }}>BotFlow</span>
          </div>
        </div>

        {/* Tenant selector */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, paddingLeft: 8 }}>
            Entreprise
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, cursor: 'pointer', width: '100%', transition: 'border-color .15s',
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'left', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenant?.name}
            </span>
            <ChevronDown size={12} color="var(--text3)" />
          </button>
          <div style={{ marginTop: 4, paddingLeft: 8 }}>
            <span style={{
              fontSize: 10, background: 'var(--accent-bg)', color: 'var(--accent2)',
              padding: '2px 6px', borderRadius: 10, fontFamily: 'var(--font-mono)',
            }}>{tenant?.planType?.toUpperCase()}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '16px 12px 0', flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6, paddingLeft: 8 }}>
            Menu
          </div>
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, marginBottom: 1,
                  color: active ? 'var(--text)' : 'var(--text2)',
                  background: active ? 'var(--bg4)' : 'transparent',
                  border: active ? '1px solid var(--border)' : '1px solid transparent',
                  transition: 'all .12s',
                }}>
                  <item.icon size={15} style={{ opacity: active ? 1 : .7, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--accent),#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, flexShrink: 0,
            }}>
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{user.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            color: 'var(--text3)', background: 'none', border: 'none',
            borderRadius: 8, cursor: 'pointer', fontSize: 13, width: '100%',
            transition: 'color .12s',
          }}>
            <LogOut size={14} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
        {children}
      </main>
    </div>
  )
}