const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api'
const AUTH_TOKEN_KEY = 'kipedido.auth_token'

type RequestOptions = RequestInit & {
  auth?: boolean
}

type ApiErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export class ApiError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function getApiErrorMessage(payload: ApiErrorPayload | null, status: number, path: string) {
  const firstValidationError = payload?.errors
    ? Object.values(payload.errors).flat().find(Boolean)
    : null

  return firstValidationError ?? payload?.message ?? `Erro ${status} ao chamar ${path}`
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  if (options.auth !== false && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message = getApiErrorMessage(payload, response.status, path)
    throw new ApiError(message, response.status, payload?.errors ?? payload)
  }

  return payload as T
}

function bodyPayload(data?: unknown) {
  if (data === undefined || data instanceof FormData) {
    return data as BodyInit | undefined
  }

  return JSON.stringify(data)
}

export function apiGet<T>(path: string, options?: RequestOptions) {
  return apiFetch<T>(path, { ...options, method: 'GET' })
}

export function apiPost<T>(path: string, data?: unknown, options?: RequestOptions) {
  return apiFetch<T>(path, { ...options, method: 'POST', body: bodyPayload(data) })
}

export function apiPut<T>(path: string, data?: unknown, options?: RequestOptions) {
  return apiFetch<T>(path, { ...options, method: 'PUT', body: bodyPayload(data) })
}

export function apiPatch<T>(path: string, data?: unknown, options?: RequestOptions) {
  return apiFetch<T>(path, { ...options, method: 'PATCH', body: bodyPayload(data) })
}

export function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiFetch<T>(path, { ...options, method: 'DELETE' })
}
