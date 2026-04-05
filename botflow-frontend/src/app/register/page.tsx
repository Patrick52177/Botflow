'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import Link from 'next/link'

const schema = z.object({
  tenantName:  z.string().min(2, 'Nom entreprise requis'),
  tenantSlug:  z.string().min(2, 'Identifiant requis').regex(/^[a-z0-9-]+$/, 'Minuscules, chiffres et tirets uniquement'),
  firstName:   z.string().min(1, 'Prénom requis'),
  lastName:    z.string().min(1, 'Nom requis'),
  email:       z.string().email('Email invalide'),
  password:    z.string().min(8, 'Minimum 8 caractères'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router  = useRouter()
  const login   = useAuthStore(s => s.login)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const tenantName = watch('tenantName', '')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.register({
        tenantName:  data.tenantName,
        tenantSlug:  data.tenantSlug,
        email:       data.email,
        password:    data.password,
        firstName:   data.firstName,
        lastName:    data.lastName,
      })
      const { user, tenant, accessToken, refreshToken } = res.data
      login(user, tenant, accessToken, refreshToken)
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(circle at 70% 80%, rgba(108,99,255,.08) 0%, transparent 50%)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(108,99,255,.3)',
          }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Créer votre espace</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>
            Essai gratuit 14 jours — aucune carte bancaire
          </p>
        </div>

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

          {/* Entreprise */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              Votre entreprise
            </div>
            <Field label="Nom de l'entreprise" error={errors.tenantName?.message}>
              <input {...register('tenantName')} placeholder="Ex: TechCorp SA" style={inputStyle} />
            </Field>
            <Field label="Identifiant unique (slug)" error={errors.tenantSlug?.message}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                <span style={{ padding: '9px 10px', color: 'var(--text3)', fontSize: 13, borderRight: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                  botflow.io/
                </span>
                <input
                  {...register('tenantSlug')}
                  placeholder="techcorp-sa"
                  style={{ ...inputStyle, border: 'none', borderRadius: 0, flex: 1 }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Minuscules, chiffres et tirets uniquement
              </div>
              {errors.tenantSlug && <p style={{ color: 'var(--red)', fontSize: 11, marginTop: 4 }}>{errors.tenantSlug.message}</p>}
            </Field>
          </div>

          {/* Compte admin */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
              Votre compte administrateur
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Prénom" error={errors.firstName?.message}>
                <input {...register('firstName')} placeholder="Jean" style={inputStyle} />
              </Field>
              <Field label="Nom" error={errors.lastName?.message}>
                <input {...register('lastName')} placeholder="Dupont" style={inputStyle} />
              </Field>
            </div>
            <Field label="Email professionnel" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="jean@techcorp.com" style={inputStyle} />
            </Field>
            <Field label="Mot de passe" error={errors.password?.message}>
              <input {...register('password')} type="password" placeholder="Minimum 8 caractères" style={inputStyle} />
            </Field>
            <Field label="Confirmer le mot de passe" error={errors.confirmPassword?.message}>
              <input {...register('confirmPassword')} type="password" placeholder="Répétez le mot de passe" style={inputStyle} />
            </Field>
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '11px 0',
            background: loading ? 'var(--bg4)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', marginTop: 8,
          }}>
            {loading ? 'Création en cours...' : 'Créer mon espace gratuitement'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 14, lineHeight: 1.6 }}>
            En créant un compte vous acceptez nos{' '}
            <span style={{ color: 'var(--accent2)', cursor: 'pointer' }}>conditions d'utilisation</span>
          </p>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, marginTop: 20 }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: 'var(--accent2)', textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
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
  fontFamily: 'inherit', outline: 'none',
}