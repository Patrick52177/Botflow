import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

api.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const original = err.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise(resolve => {
          refreshQueue.push(token => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, { refreshToken })
        const newToken = data.accessToken

        localStorage.setItem('accessToken', newToken)
        localStorage.setItem('refreshToken', data.refreshToken)

        refreshQueue.forEach(cb => cb(newToken))
        refreshQueue = []

        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        // Refresh failed — clear tokens and redirect to login
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (dto: object) => api.post('/api/auth/login', dto),
  register:(dto: object) => api.post('/api/auth/register', dto),
  refresh: (token: string) => api.post('/api/auth/refresh', { refreshToken: token }),
  logout:  () => api.post('/api/auth/logout'),
  me:      () => api.get('/api/auth/me'),
}

// ── Chatbots ──────────────────────────────────────────────────────────────────
export const chatbotApi = {
  list:         () => api.get('/api/chatbots'),
  get:          (id: string) => api.get(`/api/chatbots/${id}`),
  create:       (dto: object) => api.post('/api/chatbots', dto),
  update:       (id: string, dto: object) => api.patch(`/api/chatbots/${id}`, dto),
  delete:       (id: string) => api.delete(`/api/chatbots/${id}`),
  setStatus:    (id: string, status: string) => api.patch(`/api/chatbots/${id}/status`, { status }),
  getFlow:      (id: string) => api.get(`/api/chatbots/${id}/flow`),
  saveFlow:     (id: string, flow: object) => api.put(`/api/chatbots/${id}/flow`, flow),
  getKnowledge: (id: string) => api.get(`/api/chatbots/${id}/knowledge`),
  addKnowledge: (id: string, dto: object) => api.post(`/api/chatbots/${id}/knowledge`, dto),
  delKnowledge: (id: string, entryId: string) => api.delete(`/api/chatbots/${id}/knowledge/${entryId}`),
  getEmbed:     (id: string) => api.get(`/api/chatbots/${id}/embed`),
}

// ── Conversations ─────────────────────────────────────────────────────────────
export const conversationApi = {
  list:      (params?: object) => api.get('/api/conversations', { params }),
  get:       (id: string)  => api.get(`/api/conversations/${id}`),
  escalate:  (id: string, agentId?: string) => api.patch(`/api/conversations/${id}/escalate`, { agentId }),
  resolve:   (id: string)  => api.patch(`/api/conversations/${id}/resolve`),
  analytics: (params?: object) => api.get('/api/conversations/analytics', { params }),
}
