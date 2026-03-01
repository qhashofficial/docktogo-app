import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../../api/auth'
import { setAccessToken } from '../../api/client'
import { UserPlus, AlertCircle, Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await register(email, password, displayName || undefined)
      setAccessToken(res.data.access_token)
      navigate('/dashboard')
      window.location.reload()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center relative">
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] px-6 animate-slide-up">
        <div className="text-center mb-10">
          <img src="/logo.webp" alt="DockToGo" className="w-16 h-16 mx-auto mb-5 rounded-2xl shadow-lg shadow-primary/15 object-contain" />
          <h1 className="font-display text-3xl font-bold text-txt">Create account</h1>
          <p className="mt-2 text-txt-dim text-sm">Join DockToGo management system</p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-sm border border-edge">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2.5 bg-danger-soft border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-txt mb-1.5">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-page border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-txt mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                className="w-full bg-page border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="user@docktogo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-txt mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password"
                className="w-full bg-page border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-primary/20 text-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-txt-dim text-sm mt-6">
          Already have an account? <Link to="/login" className="text-primary font-medium hover:text-primary-dark">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
