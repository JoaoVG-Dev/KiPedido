import { apiGet, apiPost } from './api'
import type { ApiUser } from '../types'

const TOKEN_KEY = 'kipedido.auth_token'

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function login(email: string, password: string) {
  const response = await apiPost<{ token: string; user: ApiUser }>('/auth/login', {
    email,
    password,
    device_name: 'KiPedido Frontend',
  }, { auth: false })

  setAuthToken(response.token)

  return response
}

export async function logout() {
  try {
    await apiPost('/auth/logout')
  } finally {
    clearAuthToken()
  }
}

export function me() {
  return apiGet<ApiUser>('/auth/me')
}
