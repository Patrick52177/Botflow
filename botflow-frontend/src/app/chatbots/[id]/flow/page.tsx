'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ReactFlow, {
  addEdge, useNodesState, useEdgesState,
  Background, Controls, MiniMap,
  Connection, Edge, Node, NodeTypes,
  Handle, Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { chatbotApi } from '@/lib/api'
import type { Chatbot } from '@/types'
import { Save, Play, Plus, Zap, MessageSquare, GitBranch, Brain, HandMetal, HelpCircle } from 'lucide-react'

// ── Node type definitions ──────────────────────────────────────────────────
const NODE_TYPES_CONFIG = [
  { type: 'trigger',   label: 'Déclencheur', icon: Zap,            color: '#22C55E', desc: 'Début du flux' },
  { type: 'message',   label: 'Message',     icon: MessageSquare,   color: '#6C63FF', desc: 'Envoyer un texte' },
  { type: 'question',  label: 'Question',    icon: HelpCircle,      color: '#38BDF8', desc: 'Poser une question' },
  { type: 'condition', label: 'Condition',   icon: GitBranch,       color: '#F59E0B', desc: 'Si / Sinon' },
  { type: 'ai',        label: 'Réponse IA',  icon: Brain,           color: '#8B85FF', desc: 'Fallback IA' },
  { type: 'handoff',   label: 'Agent humain',icon: HandMetal,       color: '#EF4444', desc: 'Escalade' },
]

const nodeColorMap: Record<string, string> = Object.fromEntries(
  NODE_TYPES_CONFIG.map(n => [n.type, n.color])
)

// ── Custom node component ──────────────────────────────────────────────────
function BotFlowNode({ data, selected }: { data: { type: string; label: string; content?: string }; selected: boolean }) {
  const color = nodeColorMap[data.type] ?? '#6C63FF'
  const cfg = NODE_TYPES_CONFIG.find(n => n.type === data.type)

  return (
    <div style={{
      background: '#111118',
      border: `1px solid ${selected ? color : '#2A2A38'}`,
      borderRadius: 12,
      padding: '12px 16px',
      minWidth: 170,
      boxShadow: selected ? `0 0 0 2px ${color}30` : 'none',
      transition: 'border-color .15s',
    }}>
      {/* ← Ajoutez ces deux lignes */}
      <Handle type="target" position={Position.Top}
        style={{ background: color, width: 10, height: 10, border: '2px solid #111118' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: color + '20',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {cfg && <cfg.icon size={12} color={color} />}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: color, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {data.label}
        </span>
      </div>

      {data.content && (
        <div style={{
          fontSize: 12, color: '#9090A8', lineHeight: 1.45,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {data.content}
        </div>
      )}

      {/* ← Ajoutez cette ligne */}
      <Handle type="source" position={Position.Bottom}
        style={{ background: color, width: 10, height: 10, border: '2px solid #111118' }} />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  botflow: BotFlowNode,
}

// ── Helpers ────────────────────────────────────────────────────────────────
function makeNode(type: string, x: number, y: number): Node {
  const cfg = NODE_TYPES_CONFIG.find(n => n.type === type)!
  return {
    id:       `${type}-${Date.now()}`,
    type:     'botflow',
    position: { x, y },
    data:     { type, label: cfg.label, content: cfg.desc },
  }
}

function apiNodesToReactFlow(apiNodes: { id: string; type: string; label: string; contentJson: string; posX: number; posY: number }[]): Node[] {
  return apiNodes.map(n => {
    let content = ''
    try { content = JSON.parse(n.contentJson).text ?? JSON.parse(n.contentJson).event ?? '' } catch {}
    return {
      id:       n.id,
      type:     'botflow',
      position: { x: n.posX, y: n.posY },
      data:     { type: n.type, label: n.label, content },
    }
  })
}

function apiEdgesToReactFlow(apiEdges: { id: string; sourceNodeId: string; targetNodeId: string; conditionLabel?: string }[]): Edge[] {
  return apiEdges.map(e => ({
    id:     e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label:  e.conditionLabel,
    style:  { stroke: '#6C63FF', strokeWidth: 1.5 },
    labelStyle: { fill: '#9090A8', fontSize: 10 },
  }))
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function FlowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [bot, setBot] = useState<Chatbot | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Load chatbot + flow on mount
  useEffect(() => {
    if (!id) return
    Promise.all([chatbotApi.get(id), chatbotApi.getFlow(id)]).then(([botRes, flowRes]) => {
      setBot(botRes.data)
      setNodes(apiNodesToReactFlow(flowRes.data.nodes))
      setEdges(apiEdgesToReactFlow(flowRes.data.edges))
    })
  }, [id])

  const onConnect = useCallback((connection: Connection) => {
  setEdges(eds => addEdge({
    ...connection,
    style: { stroke: '#6C63FF', strokeWidth: 1.5 },
    type: 'default',
  }, eds))
}, [setEdges])

  // Add a new node from the palette
  const addNode = (type: string) => {
    const n = makeNode(type, 200 + Math.random() * 300, 150 + Math.random() * 200)
    setNodes(nds => [...nds, n])
  }

  // Save flow to API
  const saveFlow = async () => {
  if (!id) return
  setSaving(true)
  try {
    // Créer une map id ReactFlow → GUID pour les nouveaux noeuds
    const idMap: Record<string, string> = {}
    nodes.forEach(n => {
      if (n.id.includes('-') && n.id.length === 36) {
        idMap[n.id] = n.id // déjà un GUID valide
      } else {
        idMap[n.id] = crypto.randomUUID() // générer un vrai GUID
      }
    })

    const payload = {
      nodes: nodes.map(n => ({
        id:          idMap[n.id],
        type:        (n.data as { type: string }).type,
        label:       (n.data as { label: string }).label,
        contentJson: JSON.stringify({ text: (n.data as { content?: string }).content ?? '' }),
        posX:        Math.round(n.position.x),
        posY:        Math.round(n.position.y),
      })),
      edges: edges.map(e => ({
        id:             crypto.randomUUID(),
        sourceNodeId:   idMap[e.source] ?? e.source,
        targetNodeId:   idMap[e.target] ?? e.target,
        conditionLabel: e.label as string | undefined,
      })),
    }

    await chatbotApi.saveFlow(id, payload)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  } catch (err) {
    console.error('Save flow error:', err)
    alert('Erreur lors de la sauvegarde')
  } finally {
    setSaving(false)
  }
}
  // Deploy bot (set status to live)
  const deployBot = async () => {
    if (!id) return
    await saveFlow()
    await chatbotApi.setStatus(id, 'live')
    setBot(prev => prev ? { ...prev, status: 'live' } : prev)
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 20px', height: 52,
        background: '#111118', borderBottom: '1px solid #2A2A38',
        flexShrink: 0, zIndex: 10,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>
          {bot?.name ?? 'Éditeur de flux'}
        </span>

        {/* Node palette */}
        {NODE_TYPES_CONFIG.map(cfg => (
          <button key={cfg.type}
            onClick={() => addNode(cfg.type)}
            title={cfg.desc}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', background: '#16161E',
              border: `1px solid #2A2A38`, borderRadius: 7,
              color: '#9090A8', fontSize: 11, fontWeight: 500,
              cursor: 'pointer', transition: 'all .12s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = cfg.color; (e.currentTarget as HTMLElement).style.borderColor = cfg.color }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9090A8'; (e.currentTarget as HTMLElement).style.borderColor = '#2A2A38' }}
          >
            <cfg.icon size={12} />
            {cfg.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: '#2A2A38', margin: '0 4px' }} />

        <button onClick={saveFlow} disabled={saving} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', background: saving ? '#1C1C26' : '#16161E',
          border: '1px solid #363648', borderRadius: 8,
          color: saved ? '#22C55E' : '#9090A8', fontSize: 13, fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Save size={13} />
          {saving ? 'Sauvegarde...' : saved ? 'Sauvegardé ✓' : 'Sauvegarder'}
        </button>

        <button onClick={deployBot} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 14px', background: '#6C63FF',
          border: 'none', borderRadius: 8,
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <Play size={13} /> Déployer
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ReactFlow canvas */}
        <ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  onNodeClick={(_, node) => { setSelectedNodeId(node.id); setEditContent((node.data as { content?: string }).content ?? '') }}
  onPaneClick={() => setSelectedNodeId(null)}
  onEdgeClick={(_, edge) => {
    if (confirm('Supprimer cette connexion ?')) {
      setEdges(eds => eds.filter(e => e.id !== edge.id))
    }
  }}
  deleteKeyCode="Delete"
  fitView
  style={{ flex: 1 }}
>
          <Background color="#2A2A38" gap={24} size={1} />
          <Controls style={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 8 }} />
          <MiniMap
            style={{ background: '#111118', border: '1px solid #2A2A38', borderRadius: 8 }}
            nodeColor={n => nodeColorMap[(n.data as { type: string }).type] ?? '#6C63FF'}
          />
        </ReactFlow>

        {/* Properties panel */}
        {selectedNode && (
          <div style={{
            width: 280, background: '#111118', borderLeft: '1px solid #2A2A38',
            padding: 18, flexShrink: 0, overflowY: 'auto',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Propriétés du nœud
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#9090A8', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                Type
              </label>
              <div style={{
                padding: '7px 10px', background: '#16161E', borderRadius: 7,
                border: '1px solid #2A2A38', fontSize: 12, color: '#F0F0F8',
              }}>
                {(selectedNode.data as { label: string }).label}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#9090A8', fontWeight: 500, display: 'block', marginBottom: 5 }}>
                Contenu / Message
              </label>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                style={{
                  width: '100%', background: '#16161E', border: '1px solid #2A2A38',
                  borderRadius: 7, padding: '8px 10px', fontSize: 12,
                  color: '#F0F0F8', fontFamily: 'inherit', resize: 'none', outline: 'none',
                }}
                placeholder="Contenu du message..."
              />
            </div>

            <button onClick={() => {
              setNodes(nds => nds.map(n =>
                n.id === selectedNodeId
                  ? { ...n, data: { ...n.data, content: editContent } }
                  : n
              ))
            }} style={{
              width: '100%', padding: '8px 0', background: '#6C63FF',
              border: 'none', borderRadius: 8, color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Appliquer
            </button>

            <button onClick={() => {
              setNodes(nds => nds.filter(n => n.id !== selectedNodeId))
              setEdges(eds => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId))
              setSelectedNodeId(null)
            }} style={{
              width: '100%', padding: '8px 0', background: 'transparent',
              border: '1px solid #363648', borderRadius: 8, color: '#EF4444',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'inherit', marginTop: 8,
            }}>
              Supprimer ce nœud
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
