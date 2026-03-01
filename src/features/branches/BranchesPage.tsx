import { useState, type FormEvent } from 'react'
import { Building2, Plus, Loader2, X, CheckCircle2 } from 'lucide-react'
import { useBranch } from '../../context/BranchContext'
import { createBranch } from '../../api/branches'
import { useAuth } from '../../context/AuthContext'

export default function BranchesPage() {
  const { branches, loading, refresh } = useBranch()
  const { permissions } = useAuth()
  const canManage = permissions.includes('manage_team')

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await createBranch(name, code)
      setName('')
      setCode('')
      setShowForm(false)
      refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create branch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-txt">Branches</h1>
          <p className="text-txt-dim text-sm mt-1">{branches.length} branches configured</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Branch
          </button>
        )}
      </div>

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-edge shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-txt">Create Branch</h2>
              <button onClick={() => setShowForm(false)} className="p-1 text-txt-muted hover:text-txt">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-txt mb-1.5">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Amsterdam Warehouse" />
              </div>
              <div>
                <label className="block text-sm font-medium text-txt mb-1.5">Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required
                  className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="AMS" maxLength={10} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-page border border-edge rounded-xl text-sm font-medium text-txt-dim hover:text-txt transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div key={b.id} className="bg-card border border-edge rounded-2xl p-5 hover:shadow-md hover:shadow-black/[0.03] transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                {b.is_active && (
                  <span className="flex items-center gap-1 text-xs font-medium text-success bg-success-soft px-2 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <h3 className="font-display text-base font-semibold text-txt">{b.name}</h3>
              <p className="text-xs font-mono text-txt-muted mt-1">{b.code}</p>
              <p className="text-[11px] text-txt-muted mt-3">
                Created {new Date(b.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
