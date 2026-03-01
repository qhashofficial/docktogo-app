import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LogIn, AlertCircle, Loader2, Container, Truck, Shield, CheckCircle2 } from 'lucide-react'

type AnimPhase = 'idle' | 'slide-out' | 'confirm' | 'fade-out'

const SVG_PATTERN = "data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E"

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<AnimPhase>('idle')

  const goToDashboard = useCallback(() => navigate('/dashboard'), [navigate])

  useEffect(() => {
    if (phase === 'slide-out') {
      const t = setTimeout(() => setPhase('confirm'), 800)
      return () => clearTimeout(t)
    }
    if (phase === 'confirm') {
      const t = setTimeout(() => setPhase('fade-out'), 1800)
      return () => clearTimeout(t)
    }
    if (phase === 'fade-out') {
      const t = setTimeout(goToDashboard, 600)
      return () => clearTimeout(t)
    }
  }, [phase, goToDashboard])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      setPhase('slide-out')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  const isAnimating = phase !== 'idle'

  return (
    <div className={`min-h-screen flex relative overflow-hidden transition-opacity duration-500 ${phase === 'fade-out' ? 'opacity-0' : 'opacity-100'}`}>

      {/* Blue left panel */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] relative bg-gradient-to-br from-primary via-primary-dark to-[#0f3460] overflow-hidden shrink-0 transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]"
        style={{
          marginLeft: isAnimating ? '-540px' : '0px',
        }}
      >
        <div className={`absolute inset-0 bg-[url('${SVG_PATTERN}')] opacity-60`} />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary-light/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 flex flex-col justify-between p-10 text-white w-full">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="DockToGo" className="w-10 h-10 rounded-xl object-contain" />
            <div>
              <span className="font-display text-lg font-bold">DockToGo</span>
              <span className="block text-xs text-white/40">Management Platform</span>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight">
                Streamline your<br />
                <span className="text-accent-light">dock operations</span>
              </h2>
              <p className="text-sm text-white/50 mt-3 max-w-xs">
                Real-time transport tracking, smart dock assignment, and comprehensive fleet management.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Container, text: 'Smart dock assignment & queue management' },
                { icon: Truck, text: 'Real-time transport tracking with ETA' },
                { icon: Shield, text: 'Enterprise-grade security & permissions' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 animate-slide-right" style={{ animationDelay: `${400 + i * 150}ms` }}>
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4 h-4 text-accent-light" />
                  </div>
                  <span className="text-sm text-white/70">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['PS', 'JJ', 'DC'].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-white/10 border-2 border-primary-dark flex items-center justify-center">
                  <span className="text-[9px] font-bold text-white/60">{initials}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30">Trusted by logistics teams</p>
          </div>
        </div>
      </div>

      {/* Right panel — form / confirmation */}
      <div className="flex-1 bg-page flex items-center justify-center relative transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)]">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Login form — fades out when animating */}
        <div
          className="relative z-10 w-full max-w-[420px] px-6 transition-all duration-500"
          style={{
            opacity: phase === 'idle' || phase === 'slide-out' ? 1 : 0,
            transform: phase === 'confirm' || phase === 'fade-out' ? 'scale(0.95) translateY(20px)' : 'none',
            pointerEvents: isAnimating ? 'none' : 'auto',
            position: phase === 'confirm' || phase === 'fade-out' ? 'absolute' : 'relative',
          }}
        >
          <div className="text-center mb-10">
            <div className="lg:hidden mb-5">
              <img src="/logo.webp" alt="DockToGo" className="w-14 h-14 mx-auto rounded-2xl shadow-lg shadow-primary/15 object-contain" />
            </div>
            <h1 className="font-display text-3xl font-bold text-txt">Welcome back</h1>
            <p className="mt-2 text-txt-dim text-sm">Sign in to your DockToGo account</p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-sm border border-edge">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 bg-danger-soft border border-danger/20 rounded-xl px-4 py-3 text-danger text-sm animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-txt mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                  className="w-full bg-page border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="user@docktogo.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-txt mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  className="w-full bg-page border border-edge rounded-xl px-4 py-3 text-txt text-sm placeholder:text-txt-placeholder focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading || isAnimating}
                className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white font-semibold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 text-sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-edge" />
              <span className="text-[10px] text-txt-muted">or</span>
              <div className="flex-1 h-px bg-edge" />
            </div>

            <p className="text-center text-txt-dim text-sm mt-4">
              Don't have an account? <Link to="/register" className="text-primary font-medium hover:text-primary-dark transition-colors">Create one</Link>
            </p>
          </div>

          <p className="text-center text-txt-muted text-xs mt-6">DockToGo v0.1.0 — Dock Management System</p>
        </div>

        {/* Confirmation overlay — fades in after form slides */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-20 transition-all duration-600"
          style={{
            opacity: phase === 'confirm' || phase === 'fade-out' ? 1 : 0,
            pointerEvents: phase === 'confirm' || phase === 'fade-out' ? 'auto' : 'none',
          }}
        >
          <div className={`flex flex-col items-center transition-all duration-700 ${phase === 'confirm' || phase === 'fade-out' ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
            <img src="/logo.webp" alt="DockToGo" className="w-20 h-20 rounded-2xl shadow-xl shadow-primary/20 object-contain mb-6" />
            <h2 className="font-display text-2xl font-bold text-txt">
              Dock<span className="text-accent">To</span>Go
            </h2>
            <p className="text-txt-muted text-sm mt-1">Management Platform</p>

            <div className="mt-8 flex items-center gap-2 text-accent">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Authenticated successfully</span>
            </div>

            <div className="mt-5 flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse-dot" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </div>
            <p className="text-txt-placeholder text-xs mt-3">Loading workspace...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
