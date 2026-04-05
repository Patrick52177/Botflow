import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Tenant } from '@/types'

interface AuthState {
  user:         User | null
  tenant:       Tenant | null
  accessToken:  string | null
  refreshToken: string | null
  isAuthenticated: boolean

  login:  (user: User, tenant: Tenant, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      tenant:          null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      login: (user, tenant, accessToken, refreshToken) => {
        // Also store in localStorage for the Axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken',  accessToken)
          localStorage.setItem('refreshToken', refreshToken)
        }
        set({ user, tenant, accessToken, refreshToken, isAuthenticated: true })
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        set({ user: null, tenant: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      updateUser: (partial) =>
        set(state => ({ user: state.user ? { ...state.user, ...partial } : null })),
    }),
    {
      name: 'botflow-auth',
      partialize: (state) => ({
        user:         state.user,
        tenant:       state.tenant,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
