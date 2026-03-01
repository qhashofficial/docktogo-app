import { api } from './client'
import type { ApiResponse, Branch } from '../types'

export function getBranches() {
  return api<ApiResponse<Branch[]>>('/api/v1/branches')
}

export function createBranch(name: string, code: string) {
  return api<ApiResponse<Branch>>('/api/v1/branches', {
    method: 'POST',
    body: JSON.stringify({ name, code }),
  })
}
