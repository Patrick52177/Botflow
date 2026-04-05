'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { chatbotApi } from '@/lib/api'
import type { Chatbot, KnowledgeEntry } from '@/types'
import { Brain, Plus, Trash2, Save } from 'lucide-react'

const AI_PROVIDERS = [
  { id: 'claude', name: 'Claude (Anthropic)', models: ['claude-sonnet-4-20250514', 'claude-opus-4-6', 'claude-haiku-4-5-20251001'], icon: '🤖', recommended: true },
  { id: 'groq',   name: 'Groq (LLaMA 3)',    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant'], icon: '⚡', recommended: false },
  { id: 'gemini', name: 'Gemini (Google)',    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],               icon: '💎', recommended: false },
]

export default function SettingsPage() {
  const { id } = useParams<{ id: string }>()
  const [bot, setBot] = useState<Chatbot | null>(null)
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [newEntry, setNewEntry] = useState({ question: '', answer: '', keywords: '', category: '' })
  const [addingEntry, setAddingEntry] = useState(false)

  // Form state
  const [aiProvider, setAiProvider] = useState('claude')
  const [aiModel, setAiModel] = useState('claude-sonnet-4-20250514')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [temperature, setTemperature] = useState(0.4)
  const [maxTokens, setMaxTokens] = useState(512)
  const [threshold, setThreshold] = useState(0.75)

  useEffect(() => {
    if (!id) return
    Promise.all([chatbotApi.get(id), chatbotApi.getKnowledge(id)]).then(([botRes, kbRes]) => {
      const b = botRes.data as Chatbot
      setBot(b)
      setAiProvider(b.aiProvider)
      setAiModel(b.aiModel)
      setSystemPrompt(b.systemPrompt ?? '')
      setTemperature(b.temperature)
      setMaxTokens(b.maxTokens)
      setKnowledge(kbRes.data)
    })
  }, [id])

  const saveSettings = async () => {
    if (!id) return
    setSaving(true)
    try {
      await chatbotApi.update(id, {
        aiProvider, aiModel, systemPrompt,
        temperature, maxTokens, confidenceThreshold: threshold,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const addKnowledgeEntry = async () => {
    if (!id || !newEntry.question || !newEntry.answer) return
    setAddingEntry(true)
    try {
      const res = await chatbotApi.addKnowledge(id, {
        question: newEntry.question,
        answer:   newEntry.answer,
        keywords: newEntry.keywords.split(',').map(k => k.trim()).filter(Boolean),
        category: newEntry.category || undefined,
        priority: 0,
      })
      setKnowledge(prev => [...prev, res.data])
      setNewEntry({ question: '', answer: '', keywords: '', category: '' })
    } finally {
      setAddingEntry(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    if (!id) return
    await chatbotApi.delKnowledge(id, entryId)
    setKnowledge(prev => prev.filter(k => k.id !== entryId))
  }

  const currentProvider = AI_PROVIDERS.find(p => p.id === aiProvider) ?? AI_PROVIDERS[0]

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Paramètres IA</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          {bot?.name ?? 'Chargement...'} — Configuration de l'intelligence artificielle
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* AI Provider selection */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Brain size={15} color="var(--accent2)" /> Fournisseur IA
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {AI_PROVIDERS.map(p => (
              <div key={p.id}
                onClick={() => { setAiProvider(p.id); setAiModel(p.models[0]) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: aiProvider === p.id ? 'var(--accent-bg)' : 'var(--bg3)',
                  border: `1px solid ${aiProvider === p.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 10, cursor: 'pointer', transition: 'all .15s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.models[0]}</div>
                  </div>
                </div>
                {p.recommended && (
                  <span style={{ fontSize: 10, background: 'var(--green-bg)', color: 'var(--green)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                    Recommandé
                  </span>
                )}
                {aiProvider === p.id && !p.recommended && (
                  <span style={{ fontSize: 10, background: 'var(--accent-bg)', color: 'var(--accent2)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                    Actif
                  </span>
                )}
              </div>
            ))}
          </div>

          <FormGroup label="Modèle">
            <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={selectStyle}>
              {currentProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormGroup>
        </div>

        {/* Advanced config */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Paramètres avancés</div>

          <FormGroup label="Persona du bot (System Prompt)">
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={4}
              placeholder="Ex: Tu es un assistant support pour ACME. Réponds toujours en français de manière professionnelle et concise."
              style={{ ...inputStyle, resize: 'none' }}
            />
          </FormGroup>

          <FormGroup label={`Température : ${temperature.toFixed(2)} (créativité IA)`}>
            <input type="range" min={0} max={1} step={0.05} value={temperature}
              onChange={e => setTemperature(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
              <span>Déterministe</span><span>Créatif</span>
            </div>
          </FormGroup>

          <FormGroup label={`Max tokens : ${maxTokens}`}>
            <input type="range" min={128} max={2048} step={64} value={maxTokens}
              onChange={e => setMaxTokens(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
          </FormGroup>

          <FormGroup label={`Seuil de confiance pour fallback IA : ${Math.round(threshold * 100)}%`}>
            <input type="range" min={0} max={1} step={0.05} value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              En dessous de ce seuil → escalade vers un agent humain
            </div>
          </FormGroup>

          <button onClick={saveSettings} disabled={saving} style={{
            width: '100%', padding: '10px 0', marginTop: 8,
            background: saving ? 'var(--bg4)' : 'var(--accent)',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Save size={14} />
            {saving ? 'Sauvegarde...' : saved ? '✓ Sauvegardé' : 'Sauvegarder la configuration'}
          </button>
        </div>
      </div>

      {/* Knowledge base */}
      <div style={{ marginTop: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Base de connaissances (FAQ)</div>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{knowledge.length} entrée{knowledge.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Add new entry */}
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Ajouter une entrée FAQ</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <FormGroup label="Question">
              <input value={newEntry.question} onChange={e => setNewEntry(p => ({ ...p, question: e.target.value }))}
                placeholder="Ex: Comment puis-je suivre ma commande ?" style={inputStyle} />
            </FormGroup>
            <FormGroup label="Mots-clés (séparés par des virgules)">
              <input value={newEntry.keywords} onChange={e => setNewEntry(p => ({ ...p, keywords: e.target.value }))}
                placeholder="Ex: commande, suivi, livraison" style={inputStyle} />
            </FormGroup>
          </div>
          <FormGroup label="Réponse">
            <textarea value={newEntry.answer} onChange={e => setNewEntry(p => ({ ...p, answer: e.target.value }))}
              rows={2} placeholder="Réponse automatique à afficher..." style={{ ...inputStyle, resize: 'none' }} />
          </FormGroup>
          <button onClick={addKnowledgeEntry} disabled={addingEntry || !newEntry.question || !newEntry.answer} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6,
          }}>
            <Plus size={13} /> Ajouter
          </button>
        </div>

        {/* Entries list */}
        {knowledge.length === 0 ? (
          <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Aucune entrée — ajoutez des règles FAQ pour réduire les appels IA
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {knowledge.map(entry => (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 14px', background: 'var(--bg3)',
                border: '1px solid var(--border)', borderRadius: 10,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{entry.question}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, lineHeight: 1.4 }}>{entry.answer}</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {entry.keywords.map(kw => (
                      <span key={kw} style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 10,
                        background: 'var(--accent-bg)', color: 'var(--accent2)', fontFamily: 'var(--font-mono)',
                      }}>{kw}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => deleteEntry(entry.id)} style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  cursor: 'pointer', padding: 4, borderRadius: 6,
                  transition: 'color .12s', flexShrink: 0,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '8px 11px', fontSize: 13, color: 'var(--text)',
  fontFamily: 'inherit', outline: 'none',
}
const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}
