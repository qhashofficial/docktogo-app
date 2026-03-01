import { useState, type FormEvent } from 'react'
import { User, Save, Loader2, CheckCircle2, Shield } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { updateProfile } from '../../api/users'
import { ROLE_LABELS } from '../../types'

export default function ProfilePage() {
  const { user, permissions, refreshUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    setSaved(false)
    try {
      await updateProfile(displayName)
      await refreshUser()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Profile card */}
      <div className="bg-card border border-edge rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-soft flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-txt">
              {user?.displayName || user?.email}
            </h2>
            <p className="text-sm text-txt-dim">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</p>}
          {saved && (
            <p className="text-sm text-success bg-success-soft rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Profile updated
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-txt mb-1.5">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-txt mb-1.5">Email</label>
            <input type="email" value={user?.email || ''} disabled
              className="w-full bg-page border border-edge rounded-xl px-4 py-2.5 text-sm text-txt-muted cursor-not-allowed" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium shadow-sm shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Role & Permissions */}
      <div className="bg-card border border-edge rounded-2xl p-6">
        <h3 className="font-display text-base font-semibold text-txt mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Role & Permissions
        </h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-txt-dim">Role:</span>
          <span className="px-3 py-1 bg-primary-soft text-primary text-sm font-medium rounded-full">
            {ROLE_LABELS[user?.roleType ?? 1]}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {permissions.map((p) => (
            <span key={p} className="px-2.5 py-1 bg-page border border-edge rounded-lg text-xs font-mono text-txt-dim">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
