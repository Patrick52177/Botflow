'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
  }, [isAuthenticated, router])

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      flexDirection: 'column', gap: 12,
    }}>
      <div style={{
        width: 48, height: 48, background: 'var(--accent)', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>⚡</div>
      <div style={{ fontSize: 14, color: 'var(--text3)' }}>Chargement...</div>
    </div>
  )
}