'use client'
import { useEffect, useState } from 'react'
import { chatbotApi } from '@/lib/api'
import type { Chatbot } from '@/types'
import { Copy, Check, Code2, Globe, MessageCircle, Send } from 'lucide-react'

export default function IntegrationPage() {
  const [bots, setBots] = useState<Chatbot[]>([])
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null)
  const [embedScript, setEmbedScript] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedApi, setCopiedApi] = useState(false)

  useEffect(() => {
    chatbotApi.list().then(r => {
      setBots(r.data)
      if (r.data.length > 0) setSelectedBot(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedBot) return
    chatbotApi.getEmbed(selectedBot.id).then(r => setEmbedScript(r.data.script))
  }, [selectedBot])

  const copy = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  const channels = [
    { id: 'webchat',   name: 'Chat Web',         icon: Globe,          status: 'connected', color: 'var(--green)' },
    { id: 'whatsapp',  name: 'WhatsApp Business', icon: MessageCircle,  status: 'connected', color: 'var(--green)' },
    { id: 'messenger', name: 'Messenger',         icon: Send,           status: 'available', color: 'var(--text3)' },
  ]

  const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL ?? 'https://api.botflow.io'}/api/messages`
  const apiKey = selectedBot ? `bf_${selectedBot.tenantId.slice(0,8)}_sk_live_...` : 'Sélectionnez un chatbot'

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Intégration & Canaux</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          Connectez votre chatbot à votre site web et vos applications
        </p>
      </div>

      {/* Bot selector */}
      {bots.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
            Chatbot à intégrer
          </label>
          <select
            value={selectedBot?.id ?? ''}
            onChange={e => setSelectedBot(bots.find(b => b.id === e.target.value) ?? null)}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', fontSize: 13,
              color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
            }}
          >
            {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        {/* Embed script */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Code2 size={15} color="var(--accent2)" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Script d'intégration — Chat Web</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
            Collez ce code juste avant la balise{' '}
            <code style={{ background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4, color: 'var(--accent2)', fontSize: 11 }}>
              &lt;/body&gt;
            </code>{' '}
            de votre site web.
          </p>

          <div style={{ position: 'relative' }}>
            <pre style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '16px 50px 16px 16px',
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--blue)',
              lineHeight: 1.7, overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap',
            }}>
              {embedScript || `<!-- Sélectionnez un chatbot pour voir le script -->`}
            </pre>
            <button
              onClick={() => copy(embedScript, setCopied)}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'var(--bg4)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '4px 10px', fontSize: 11,
                color: copied ? 'var(--green)' : 'var(--text2)',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
              {copied ? <><Check size={11} /> Copié</> : <><Copy size={11} /> Copier</>}
            </button>
          </div>

          <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Personnalisation via attributs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text3)' }}>
              {[
                ['data-theme',    '#6C63FF', 'Couleur principale'],
                ['data-lang',     'fr',      'Langue (fr/en/ar)'],
                ['data-position', 'bottom-right', 'Position widget'],
                ['data-api-url',  'https://...', 'URL de votre API'],
              ].map(([attr, val, desc]) => (
                <div key={attr} style={{ background: 'var(--bg4)', padding: '6px 8px', borderRadius: 6 }}>
                  <span style={{ color: 'var(--amber)' }}>{attr}</span>
                  <span style={{ color: 'var(--text3)' }}>="</span>
                  <span style={{ color: 'var(--accent2)' }}>{val}</span>
                  <span style={{ color: 'var(--text3)' }}>"</span>
                  <div style={{ color: 'var(--text3)', fontFamily: 'var(--font-sans)', marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Channels */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Canaux disponibles</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {channels.map(ch => (
              <div key={ch.id} style={{
                background: 'var(--bg3)',
                border: `1px solid ${ch.status === 'connected' ? 'rgba(34,197,94,.3)' : 'var(--border)'}`,
                borderRadius: 12, padding: '16px', textAlign: 'center',
                cursor: ch.status === 'connected' ? 'default' : 'pointer',
                transition: 'border-color .2s',
              }}>
                <ch.icon size={24} color={ch.status === 'connected' ? 'var(--green)' : 'var(--text3)'}
                  style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{ch.name}</div>
                <span style={{
                  fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                  background: ch.status === 'connected' ? 'var(--green-bg)' : 'var(--bg4)',
                  color: ch.status === 'connected' ? 'var(--green)' : 'var(--text3)',
                }}>
                  {ch.status === 'connected' ? '● Connecté' : 'Non connecté'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* REST API */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>API REST & Webhooks</div>
          <pre style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: 16, fontFamily: 'var(--font-mono)',
            fontSize: 12, color: 'var(--blue)', lineHeight: 1.8, margin: 0, position: 'relative',
          }}>
            <span style={{ color: 'var(--text3)'  }}>{`# Envoyer un message via API REST\n`}</span>
            <span style={{ color: 'var(--green)'  }}>POST</span>{` `}
            <span style={{ color: 'var(--accent2)'}}>{apiEndpoint}</span>{'\n\n'}
            <span style={{ color: 'var(--text3)'  }}>{`# Headers requis\n`}</span>
            <span style={{ color: 'var(--amber)'  }}>Authorization:</span>{` `}
            <span style={{ color: 'var(--accent2)'}}>{`Bearer ${apiKey}`}</span>{'\n'}
            <span style={{ color: 'var(--amber)'  }}>Content-Type:</span>{` `}
            <span style={{ color: 'var(--accent2)'}}>{`application/json`}</span>{'\n\n'}
            <span style={{ color: 'var(--text3)'  }}>{`# Body\n`}</span>
            {`{\n  "tenantId": "${selectedBot?.tenantId ?? 'YOUR_TENANT_ID'}",\n  "content": "Bonjour !"\n}`}
          </pre>
          <button
            onClick={() => copy(`Bearer ${apiKey}`, setCopiedApi)}
            style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '6px 12px', fontSize: 12,
              color: copiedApi ? 'var(--green)' : 'var(--text2)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
            {copiedApi ? <><Check size={12} /> Clé copiée</> : <><Copy size={12} /> Copier la clé API</>}
          </button>
        </div>
      </div>
    </div>
  )
}
