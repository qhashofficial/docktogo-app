import { api } from './client'
import type { ApiResponse } from '../types'

export interface PlanningMetrics {
  [key: string]: unknown
  counts?: Record<string, unknown>
  lag_seconds?: number
  oldest_new_age_seconds?: number
  stuck_processing_count?: number
  cb_state?: string
}

export interface OutboxMetrics {
  [key: string]: unknown
  counts?: Record<string, unknown>
  oldest_new_age_seconds?: number
  stuck_processing_count?: number
  cb_state?: string
}

export function getPlanningMetrics() {
  return api<ApiResponse<PlanningMetrics>>('/api/v1/integrations/planning/metrics')
}

export function getOutboxMetrics() {
  return api<ApiResponse<OutboxMetrics>>('/api/v1/integrations/outbox/metrics')
}

export function requeueCapture(captureId: string) {
  return api<ApiResponse<{ requeued: boolean }>>(
    `/api/v1/integrations/planning/requeue/${captureId}`,
    { method: 'POST' },
  )
}
