'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { chatbotApi } from '@/lib/api'

export default function NewChatbotPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    description: '',
    channel: 'webchat',
    welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
    systemPrompt: 'Tu es un assistant support. Réponds toujours en français de manière professionnelle et concise.',
  })

  const handleSubmit = async () => {
    if (!form.name) { setError('Le nom est requis'); return }
    setLoading(true)
    setError('')
    try {
      const res = await chatbotApi.create(form)
      router.push(`/chatbots`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 28, maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Nouveau chatbot</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          Configurez votre chatbot en quelques secondes
        </p>
      </div>

      {error && (
        <div style={{
          background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)',
          borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          color: 'var(--red)', fontSize: 13,
        }}>{error}</div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <Field label="Nom du chatbot *">
          <input
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Ex: Support Client"
            style={inputStyle}
          />
        </Field>

        <Field label="Description">
          <input
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Ex: Répond aux questions fréquentes"
            style={inputStyle}
          />
        </Field>

        <Field label="Canal">
          <select
            value={form.channel}
            onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
            style={inputStyle}
          >
            <option value="webchat">Chat Web (Widget)</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="messenger">Messenger</option>
          </select>
        </Field>

        <Field label="Message d'accueil">
          <input
            value={form.welcomeMessage}
            onChange={e => setForm(p => ({ ...p, welcomeMessage: e.target.value }))}
            style={inputStyle}
          />
        </Field>

        <Field label="Persona IA (System Prompt)">
          <textarea
            value={form.systemPrompt}
            onChange={e => setForm(p => ({ ...p, systemPrompt: e.target.value }))}
            rows={4}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </Field>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => router.push('/chatbots')}
            style={{
              padding: '10px 20px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text2)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1, padding: '10px 0',
              background: loading ? 'var(--bg4)' : 'var(--accent)',
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Création...' : 'Créer le chatbot'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
  fontFamily: 'inherit', outline: 'none',
}