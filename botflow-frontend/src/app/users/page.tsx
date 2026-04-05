'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { UserPlus, Trash2, Shield, User, Crown } from 'lucide-react'

interface TeamUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'agent'
  lastLoginAt?: string
  createdAt: string
}

export default function UsersPage() {
  const { user: currentUser, tenant } = useAuthStore()
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', firstName: '', lastName: '', role: 'agent' })
  const [inviting, setInviting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const res = await api.get('/api/users')
      setUsers(res.data)
    } catch {
      // fallback — afficher l'utilisateur actuel
      if (currentUser) {
        setUsers([{
          id: currentUser.id,
          email: currentUser.email,
          firstName: currentUser.firstName,
          lastName: currentUser.lastName,
          role: currentUser.role as 'admin' | 'agent',
          createdAt: new Date().toISOString(),
        }])
      }
    } finally {
      setLoading(false)
    }
  }

  const inviteUser = async () => {
    if (!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName) {
      setError('Tous les champs sont requis')
      return
    }
    setInviting(true)
    setError('')
    try {
      const res = await api.post('/api/users/invite', inviteForm)
      setUsers(prev => [...prev, res.data])
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'agent' })
      setShowInvite(false)
      setSuccess('Utilisateur invité avec succès !')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Erreur lors de l\'invitation')
    } finally {
      setInviting(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await api.delete(`/api/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  const roleConfig = {
    admin:      { label: 'Admin',     icon: Crown,  color: 'var(--accent2)', bg: 'var(--accent-bg)' },
    agent:      { label: 'Agent',     icon: User,   color: 'var(--text2)',   bg: 'var(--bg4)' },
    superadmin: { label: 'Super Admin', icon: Shield, color: 'var(--amber)', bg: 'var(--amber-bg)' },
  }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Équipe</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
            {tenant?.name} · {users.length} membre{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <UserPlus size={15} /> Inviter un membre
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--green)', fontSize: 13 }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Formulaire d'invitation */}
      {showInvite && (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--accent)',
          borderRadius: 'var(--r2)', padding: 20, marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
            <UserPlus size={15} color="var(--accent2)" />
            Inviter un nouveau membre
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input value={inviteForm.firstName} onChange={e => setInviteForm(p => ({ ...p, firstName: e.target.value }))}
                placeholder="Jean" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input value={inviteForm.lastName} onChange={e => setInviteForm(p => ({ ...p, lastName: e.target.value }))}
                placeholder="Dupont" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={inviteForm.email} onChange={e => setInviteForm(p => ({ ...p, email: e.target.value }))}
                type="email" placeholder="jean@entreprise.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Rôle</label>
              <select value={inviteForm.role} onChange={e => setInviteForm(p => ({ ...p, role: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={inviteUser} disabled={inviting} style={{
              padding: '8px 18px', background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {inviting ? 'Invitation...' : 'Inviter'}
            </button>
            <button onClick={() => { setShowInvite(false); setError('') }} style={{
              padding: '8px 14px', background: 'transparent', color: 'var(--text2)',
              border: '1px solid var(--border)', borderRadius: 8, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
      ) : (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          {users.map((u, i) => {
            const role = roleConfig[u.role as keyof typeof roleConfig] ?? roleConfig.agent
            const isCurrentUser = u.id === currentUser?.id
            const RoleIcon = role.icon

            return (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 18px',
                borderBottom: i < users.length - 1 ? '1px solid var(--border)' : 'none',
                background: isCurrentUser ? 'var(--accent-bg)' : 'transparent',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: isCurrentUser ? 'var(--accent)' : 'var(--bg4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, flexShrink: 0,
                  color: isCurrentUser ? '#fff' : 'var(--text2)',
                }}>
                  {u.firstName[0]}{u.lastName[0]}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                      {u.firstName} {u.lastName}
                    </span>
                    {isCurrentUser && (
                      <span style={{ fontSize: 10, background: 'var(--accent-bg)', color: 'var(--accent2)', padding: '1px 6px', borderRadius: 10, fontWeight: 600 }}>
                        Vous
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{u.email}</div>
                </div>

                {/* Dernière connexion */}
                <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>
                  <div>Membre depuis</div>
                  <div style={{ fontFamily: 'var(--font-mono)' }}>
                    {new Date(u.createdAt).toLocaleDateString('fr')}
                  </div>
                </div>

                {/* Rôle */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20,
                  background: role.bg, color: role.color,
                  fontSize: 12, fontWeight: 500, minWidth: 80, justifyContent: 'center',
                }}>
                  <RoleIcon size={12} />
                  {role.label}
                </div>

                {/* Actions */}
                {!isCurrentUser && currentUser?.role === 'admin' && (
                  <button
                    onClick={() => deleteUser(u.id)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text3)',
                      cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'color .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text3)'}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info rôles */}
      <div style={{ marginTop: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Permissions par rôle</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { role: 'Admin', color: 'var(--accent2)', perms: ['Gérer les chatbots', 'Inviter des membres', 'Voir les analytiques', 'Configurer l\'IA', 'Gérer la facturation'] },
            { role: 'Agent', color: 'var(--text2)',   perms: ['Voir les conversations', 'Répondre aux clients', 'Escalader vers admin', 'Voir les FAQ'] },
          ].map(r => (
            <div key={r.role} style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 8 }}>{r.role}</div>
              {r.perms.map(p => (
                <div key={p} style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: 'var(--green)', fontSize: 10 }}>✓</span> {p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: 'var(--text2)', marginBottom: 5,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
  fontFamily: 'inherit', outline: 'none',
}