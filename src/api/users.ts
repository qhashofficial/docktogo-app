import { api } from './client'
import type { ApiResponse, User } from '../types'

export function getProfile() {
  return api<ApiResponse<{ profile: User; permissions: string[] }>>('/auth/me')
}

export function updateProfile(displayName: string) {
  return api<ApiResponse<User>>('/api/v1/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  })
}
