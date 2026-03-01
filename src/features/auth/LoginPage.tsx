import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogIn, AlertCircle, Loader2, Container } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void flex items-center justify-center relative overflow-hidden">
      {/* Ambient grid */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            'linear-gradient(rgba(232,149,10,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,149,10,0.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-brand/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* Accent lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-brand/20 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-t from-transparent via-brand/20 to-transparent" />

      <div className="relative z-10 w-full max-w-[420px] px-6 animate-slide-up">
        {/* Logo block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 mb-6">
            <Container className="w-8 h-8 text-brand" />
          </div>
          <h1 className="font-display text-[3.5rem] leading-none font-extrabold tracking-tight text-txt">
            DOCK<span className="text-brand">TO</span>GO
          </h1>
          <p className="mt-3 text-txt-dim text-sm tracking-[0.2em] uppercase font-body">
            Dock Management System
          </p>
        </div>

        {/* Card */}
        <div className="relative">
          {/* Card glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-brand/20 via-edge to-edge pointer-events-none" />

          <div className="relative bg-panel rounded-2xl p-8">
            {/* Accent bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-txt-dim uppercase tracking-[0.15em] mb-2 font-body">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-muted focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 transition-all font-body"
                  placeholder="user@docktogo.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-txt-dim uppercase tracking-[0.15em] mb-2 font-body">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-raised border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-muted focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 transition-all font-body"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-light text-void font-semibold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2 text-sm shadow-lg shadow-brand/20 hover:shadow-brand/30"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-txt-muted text-[11px] mt-8 font-mono tracking-wider">
          v0.1.0 — ENTERPRISE DOCK MANAGEMENT
        </p>
      </div>
    </div>
  )
}
