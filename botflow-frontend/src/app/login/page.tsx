'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  tenantSlug: z.string().min(1, 'Identifiant entreprise requis'),
  email:      z.string().email('Email invalide'),
  password:   z.string().min(6, 'Mot de passe trop court'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router  = useRouter()
  const login   = useAuthStore(s => s.login)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(data)
      const { user, tenant, accessToken, refreshToken } = res.data
      login(user, tenant, accessToken, refreshToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(108,99,255,.08) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px', boxShadow: '0 0 40px rgba(108,99,255,.3)',
          }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>BotFlow</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
            Connectez-vous à votre espace
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: 28,
        }}>
          {error && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              color: 'var(--red)', fontSize: 13,
            }}>{error}</div>
          )}

          <Field label="Identifiant entreprise" error={errors.tenantSlug?.message}>
            <input {...register('tenantSlug')} placeholder="ex: techcorp-sa"
              style={inputStyle} autoComplete="organization" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="vous@entreprise.com"
              style={inputStyle} autoComplete="email" />
          </Field>

          <Field label="Mot de passe" error={errors.password?.message}>
            <input {...register('password')} type="password" placeholder="••••••••"
              style={inputStyle} autoComplete="current-password" />
          </Field>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0',
            background: loading ? 'var(--bg4)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background .15s', marginTop: 8,
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 20 }}>
          Pas encore de compte ?{' '}
          <a href="/register" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
            Créer un espace
          </a>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
  fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s',
}
