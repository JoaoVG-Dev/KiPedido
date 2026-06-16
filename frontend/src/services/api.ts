const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

type RequestOptions = RequestInit & {
  token?: string
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`Erro ${response.status} ao chamar ${path}`)
  }

  return response.json() as Promise<T>
}
