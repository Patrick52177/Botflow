'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { chatbotApi } from '@/lib/api'
import type { KnowledgeEntry } from '@/types'
import { Plus, Trash2, Zap, Brain } from 'lucide-react'

export default function ResponsesPage() {
  const { id } = useParams<{ id: string }>()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    keywords: '',
    answer: '',
    category: '',
  })

useEffect(() => {
  if (!id || id === 'undefined') return
  chatbotApi.getKnowledge(id)
    .then(r => setEntries(r.data))
    .catch(err => console.error('Knowledge error:', err))
    .finally(() => setLoading(false))
}, [id])

  const addEntry = async () => {
    if (!form.keywords || !form.answer) return
    setSaving(true)
    try {
      const keywords = form.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
      const res = await chatbotApi.addKnowledge(id, {
        question: keywords[0],
        answer: form.answer,
        keywords,
        category: form.category || 'Général',
        priority: 5,
      })
      setEntries(prev => [res.data, ...prev])
      setForm({ keywords: '', answer: '', category: '' })
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (entryId: string) => {
    await chatbotApi.delKnowledge(id, entryId)
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Réponses automatiques</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
          Quand un visiteur écrit un mot-clé → le bot répond instantanément sans IA
        </p>
      </div>

      {/* Explication visuelle */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent)',
        borderRadius: 10, marginBottom: 24, fontSize: 13,
      }}>
        <Zap size={16} color="var(--accent2)" style={{ flexShrink: 0 }} />
        <span style={{ color: 'var(--text2)' }}>
          Les réponses par mots-clés sont <strong style={{ color: 'var(--text)' }}>instantanées</strong> et gratuites.
          Si aucun mot-clé ne correspond, l'<strong style={{ color: 'var(--text)' }}>IA prend le relais</strong>.
        </span>
      </div>

      {/* Formulaire d'ajout */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 14, padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Plus size={15} color="var(--accent2)" />
          Ajouter une réponse automatique
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
            Mots-clés déclencheurs <span style={{ color: 'var(--text3)' }}>(séparés par des virgules)</span>
          </label>
          <input
            value={form.keywords}
            onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
            placeholder="Ex: prix, tarif, devis, combien"
            style={inputStyle}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            Si le visiteur écrit l'un de ces mots → la réponse ci-dessous s'affiche automatiquement
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
            Réponse automatique
          </label>
          <textarea
            value={form.answer}
            onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
            rows={3}
            placeholder="Ex: Nos tarifs commencent à 49€/mois. Souhaitez-vous un devis personnalisé ?"
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 5 }}>
              Catégorie <span style={{ color: 'var(--text3)' }}>(optionnel)</span>
            </label>
            <input
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              placeholder="Ex: Tarifs, Support, Contact..."
              style={inputStyle}
            />
          </div>
          <button
            onClick={addEntry}
            disabled={saving || !form.keywords || !form.answer}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', background: form.keywords && form.answer ? 'var(--accent)' : 'var(--bg4)',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} />
            {saving ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Liste des réponses */}
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text2)' }}>
        {entries.length} réponse{entries.length !== 1 ? 's' : ''} automatique{entries.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
      ) : entries.length === 0 ? (
        <div style={{
          border: '1px dashed var(--border2)', borderRadius: 10,
          padding: 32, textAlign: 'center', color: 'var(--text3)',
        }}>
          <Brain size={28} style={{ margin: '0 auto 10px', opacity: .5 }} />
          <div style={{ fontSize: 13, marginBottom: 4 }}>Aucune réponse automatique</div>
          <div style={{ fontSize: 12 }}>Toutes les questions sont traitées par l'IA</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {entries.map(entry => (
            <div key={entry.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              {/* Icône */}
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: 'var(--green-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Zap size={14} color="var(--green)" />
              </div>

              {/* Contenu */}
              <div style={{ flex: 1 }}>
                {/* Mots-clés */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {entry.keywords.map(kw => (
                    <span key={kw} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 20,
                      background: 'var(--accent-bg)', color: 'var(--accent2)',
                      fontFamily: 'var(--font-mono)', fontWeight: 500,
                    }}>
                      {kw}
                    </span>
                  ))}
                  {entry.category && (
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 20,
                      background: 'var(--bg4)', color: 'var(--text3)',
                      marginLeft: 4,
                    }}>
                      {entry.category}
                    </span>
                  )}
                </div>

                {/* Réponse */}
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.55 }}>
                  {entry.answer}
                </div>

                {/* Stats */}
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  Utilisée {entry.priority} fois
                </div>
              </div>

              {/* Supprimer */}
              <button
                onClick={() => deleteEntry(entry.id)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  cursor: 'pointer', padding: 6, borderRadius: 6,
                  transition: 'color .12s', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
  fontFamily: 'inherit', outline: 'none',
}