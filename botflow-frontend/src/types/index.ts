// ── Auth ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'superadmin' | 'admin' | 'agent'
  tenantId: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  planType: 'starter' | 'pro' | 'enterprise'
  isActive: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: User
  tenant: Tenant
}

export interface LoginDto {
  email: string
  password: string
  tenantSlug: string
}

export interface RegisterDto {
  tenantName: string
  tenantSlug: string
  email: string
  password: string
  firstName: string
  lastName: string
}

// ── Chatbot ───────────────────────────────────────────────────────────────────
export interface Chatbot {
  id: string
  tenantId: string
  name: string
  description?: string
  status: 'draft' | 'live' | 'paused'
  channel: 'webchat' | 'whatsapp' | 'messenger'
  aiProvider: string
  aiModel: string
  systemPrompt?: string
  temperature: number
  maxTokens: number
  widgetColor?: string
  welcomeMessage?: string
  createdAt: string
  conversationCount: number
  messageCount: number
}

export interface CreateChatbotDto {
  name: string
  description?: string
  channel: string
  welcomeMessage?: string
  systemPrompt?: string
}

export interface UpdateChatbotDto {
  name?: string
  description?: string
  status?: string
  aiProvider?: string
  aiModel?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
  confidenceThreshold?: number
  widgetColor?: string
  welcomeMessage?: string
}

// ── Flow ──────────────────────────────────────────────────────────────────────
export interface FlowNode {
  id: string
  chatbotId: string
  type: 'trigger' | 'message' | 'question' | 'condition' | 'ai' | 'action' | 'handoff'
  label: string
  contentJson: string
  posX: number
  posY: number
}

export interface FlowEdge {
  id: string
  sourceNodeId: string
  targetNodeId: string
  conditionLabel?: string
}

export interface FlowData {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

// ── Knowledge ─────────────────────────────────────────────────────────────────
export interface KnowledgeEntry {
  id: string
  question: string
  answer: string
  keywords: string[]
  category?: string
  isActive: boolean
  priority: number
}

// ── Conversation ──────────────────────────────────────────────────────────────
export interface Conversation {
  id: string
  chatbotId: string
  status: 'active' | 'resolved' | 'escalated' | 'abandoned'
  channel: string
  sessionId: string
  visitorName?: string
  visitorEmail?: string
  country?: string
  assignedAgentId?: string
  createdAt: string
  resolvedAt?: string
  messageCount: number
  aiMessageCount: number
  satisfactionScore?: number
  lastMessage?: Message
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'bot' | 'agent' | 'system'
  content: string
  contentType: string
  isAiGenerated: boolean
  aiProvider?: string
  confidenceScore?: number
  createdAt: string
}

export interface ConversationList {
  items: Conversation[]
  total: number
  page: number
  pageSize: number
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface Analytics {
  totalConversations: number
  activeConversations: number
  resolvedConversations: number
  escalatedConversations: number
  aiResolutionRate: number
  avgResponseTimeMs: number
  avgSatisfactionScore: number
  totalMessages: number
  aiMessages: number
  dailyStats: { date: string; conversations: number; messages: number }[]
  channelStats: { channel: string; count: number; percentage: number }[]
  topIntents: { intent: string; count: number; percentage: number }[]
}

// ── API responses ─────────────────────────────────────────────────────────────
export interface ApiError {
  error: string
  status: number
  traceId?: string
}
