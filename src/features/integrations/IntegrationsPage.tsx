import { useEffect, useState } from 'react'
import {
  Activity,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Inbox,
  Send,
  RotateCw,
} from 'lucide-react'
import {
  getPlanningMetrics,
  getOutboxMetrics,
  requeueCapture,
  type PlanningMetrics,
  type OutboxMetrics,
} from '../../api/integrations'

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return String(val)
  return JSON.stringify(val, null, 0)
}

function isPrimitive(val: unknown): boolean {
  return val === null || val === undefined || typeof val !== 'object'
}

const SKIP_KEYS = new Set(['counts', 'cb_state'])

export default function IntegrationsPage() {
  const [planning, setPlanning] = useState<PlanningMetrics | null>(null)
  const [outbox, setOutbox] = useState<OutboxMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [requeueId, setRequeueId] = useState('')
  const [requeueResult, setRequeueResult] = useState<string | null>(null)

  const loadMetrics = () => {
    setLoading(true)
    Promise.all([
      getPlanningMetrics().then((r) => setPlanning(r.data)).catch(() => setPlanning(null)),
      getOutboxMetrics().then((r) => setOutbox(r.data)).catch(() => setOutbox(null)),
    ]).finally(() => setLoading(false))
  }

  useEffect(loadMetrics, [])

  const handleRequeue = async () => {
    if (!requeueId.trim()) return
    setRequeueResult(null)
    try {
      const r = await requeueCapture(requeueId.trim())
      setRequeueResult(r.data.requeued ? 'Requeued successfully' : 'Not requeued')
      setRequeueId('')
    } catch (err: unknown) {
      setRequeueResult(err instanceof Error ? err.message : 'Requeue failed')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-txt">Integrations</h1>
          <p className="text-txt-dim text-sm mt-1">Planning receiver and outbox metrics</p>
        </div>
        <button onClick={loadMetrics} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-edge rounded-xl text-sm text-txt-dim hover:text-txt transition-all disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MetricsCard title="Planning Receiver" icon={<Inbox className="w-5 h-5 text-primary" />} data={planning} />
          <MetricsCard title="Outbox" icon={<Send className="w-5 h-5 text-primary" />} data={outbox} />

          {/* Requeue */}
          <div className="lg:col-span-2 bg-card border border-edge rounded-2xl p-6">
            <h2 className="font-display text-base font-semibold text-txt mb-4 flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-primary" /> Requeue Capture
            </h2>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-txt mb-1.5">Capture ID</label>
                <input value={requeueId} onChange={(e) => setRequeueId(e.target.value)}
                  className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="UUID of captured payload" />
              </div>
              <button onClick={handleRequeue} disabled={!requeueId.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark disabled:opacity-50 transition-colors">
                Requeue
              </button>
            </div>
            {requeueResult && (
              <p className={`mt-3 text-sm ${requeueResult.includes('success') ? 'text-success' : 'text-danger'}`}>
                {requeueResult}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function MetricsCard({ title, icon, data }: { title: string; icon: React.ReactNode; data: PlanningMetrics | OutboxMetrics | null }) {
  if (!data) {
    return (
      <div className="bg-card border border-edge rounded-2xl p-6">
        <h2 className="font-display text-base font-semibold text-txt mb-5 flex items-center gap-2">
          {icon} {title}
        </h2>
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-txt-muted text-sm">Unable to load metrics</p>
        </div>
      </div>
    )
  }

  const cbState = typeof data.cb_state === 'string' ? data.cb_state : null

  const counts = data.counts && typeof data.counts === 'object' ? data.counts : null

  const otherFields = Object.entries(data).filter(
    ([key]) => !SKIP_KEYS.has(key) && !key.startsWith('_'),
  )

  return (
    <div className="bg-card border border-edge rounded-2xl p-6">
      <h2 className="font-display text-base font-semibold text-txt mb-5 flex items-center gap-2">
        {icon} {title}
      </h2>
      <div className="space-y-4">
        {cbState && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
            cbState === 'CLOSED' ? 'bg-success-soft text-success' :
            cbState === 'OPEN' ? 'bg-danger-soft text-danger' :
            'bg-warning-soft text-warning'
          }`}>
            <Activity className="w-4 h-4" />
            Circuit Breaker: {cbState}
          </div>
        )}

        {/* Counts (only primitive values as big numbers, objects as cards) */}
        {counts && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(counts).map(([key, val]) => (
              <div key={key} className="bg-page rounded-xl p-3">
                <p className="text-[11px] text-txt-muted uppercase tracking-wider">{key.replace(/_/g, ' ')}</p>
                {isPrimitive(val) ? (
                  <p className="font-display text-2xl font-bold text-txt mt-1">{formatValue(val)}</p>
                ) : (
                  <pre className="text-xs font-mono text-txt-dim mt-1 whitespace-pre-wrap break-all">{JSON.stringify(val, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Other fields */}
        {otherFields.length > 0 && (
          <div className="space-y-2">
            {otherFields.map(([key, val]) => (
              <div key={key} className="flex justify-between text-sm px-1">
                <span className="text-txt-dim">{key.replace(/_/g, ' ')}</span>
                {isPrimitive(val) ? (
                  <span className="font-mono text-txt">{formatValue(val)}</span>
                ) : (
                  <span className="font-mono text-txt-dim text-xs">{JSON.stringify(val)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
