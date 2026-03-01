import { api } from './client'
import type { ApiResponse, AuthData, User } from '../types'

export function login(email: string, password: string) {
  return api<ApiResponse<AuthData>>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function register(email: string, password: string, displayName?: string) {
  return api<ApiResponse<AuthData>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, displayName }),
  })
}

export function refreshSession() {
  return api<ApiResponse<AuthData>>('/auth/refresh', { method: 'POST' })
}

export function getMe() {
  return api<ApiResponse<{ profile: User; permissions: string[] }>>('/auth/me')
}

export function logout() {
  return api<ApiResponse<null>>('/auth/logout', { method: 'POST' })
}
