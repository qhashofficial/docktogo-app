const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

async function attemptRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const json = await res.json()
    const token = json.data.access_token as string
    setAccessToken(token)
    return token
  } catch {
    return null
  }
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T>(
  path: string,
  opts: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE}${path}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  let res = await fetch(url, { ...opts, headers, credentials: 'include' })

  if (res.status === 401 && accessToken) {
    const fresh = await attemptRefresh()
    if (fresh) {
      headers['Authorization'] = `Bearer ${fresh}`
      res = await fetch(url, { ...opts, headers, credentials: 'include' })
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message || res.statusText)
  }

  return res.json()
}
