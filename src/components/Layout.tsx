import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Container,
  Truck,
  ChevronDown,
  LogOut,
  User,
  Building2,
  ChevronRight,
  Activity,
  Search,
  Bell,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { useZoom } from '../context/ZoomContext'
import { useTheme } from '../context/ThemeContext'
import { ROLE_LABELS } from '../types'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/docks', icon: Container, label: 'Dock Management' },
  { to: '/transports', icon: Truck, label: 'Transports' },
  { to: '/branches', icon: Building2, label: 'Branches' },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/docks': 'Dock Management',
  '/transports': 'Transports',
  '/branches': 'Branches',
  '/profile': 'Profile',
  '/integrations': 'Integrations',
}

function SidebarLink({
  to,
  icon: Icon,
  label,
}: {
  to: string
  icon: typeof LayoutDashboard
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
          isActive
            ? 'bg-primary text-white shadow-md shadow-primary/25'
            : 'text-txt-dim hover:bg-page hover:text-txt'
        }`
      }
    >
      <Icon className="w-[18px] h-[18px]" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
    </NavLink>
  )
}

function LiveClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="text-xs font-mono text-txt-muted tabular-nums">
      {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  )
}

export default function Layout() {
  const { user, logout, permissions } = useAuth()
  const { branches, activeBranch, setBranch } = useBranch()
  const { userZoom, zoomIn, zoomOut, resetZoom } = useZoom()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [branchOpen, setBranchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const initials = user?.displayName
    ? user.displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? '??'

  const pageTitle = PAGE_TITLES[location.pathname]
    || (location.pathname.startsWith('/transports/') ? 'Transport Detail' : 'DockToGo')

  const searchResults = searchQuery.trim() ? [
    { label: 'Dashboard', path: '/dashboard', match: 'overview' },
    { label: 'Transports', path: '/transports', match: 'transports' },
    { label: 'Dock Management', path: '/docks', match: 'docks dock' },
    { label: 'Branches', path: '/branches', match: 'branches' },
    { label: 'Profile', path: '/profile', match: 'profile settings' },
    { label: 'Integrations', path: '/integrations', match: 'integrations metrics' },
  ].filter(r => r.label.toLowerCase().includes(searchQuery.toLowerCase()) || r.match.includes(searchQuery.toLowerCase())) : []

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {/* Full-width animated gradient stripe */}
      <div className="h-1 w-full fixed top-0 left-0 z-50 animate-gradient" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-primary), var(--color-accent), var(--color-primary))', backgroundSize: '300% 100%' }} />

      <div className="flex flex-1 pt-1">
      {/* Sidebar */}
      <aside className="fixed top-1 left-0 h-[calc(100%-4px)] w-60 bg-sidebar border-r border-edge flex flex-col z-40">

        {/* Brand */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-edge shrink-0">
          <img src="/logo.webp" alt="DockToGo" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <span className="font-display text-base font-bold text-txt tracking-tight">
              Dock<span className="text-accent">To</span>Go
            </span>
            <span className="block text-[10px] text-txt-muted font-medium -mt-0.5">
              Management
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} {...item} />
          ))}

          <div className="h-px bg-edge my-4" />

          {permissions.includes('manage_team') && (
            <SidebarLink to="/integrations" icon={Activity} label="Integrations" />
          )}
          <SidebarLink to="/profile" icon={User} label="Profile" />
        </nav>

        {/* System status */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-soft/50">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            <span className="text-[10px] text-accent-dark font-medium">System Operational</span>
          </div>
        </div>

        {/* User card */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-page">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-txt truncate leading-tight">
                {user?.displayName || user?.email?.split('@')[0]}
              </p>
              <p className="text-[11px] text-txt-muted truncate leading-tight">
                {ROLE_LABELS[user?.roleType ?? 1]}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-txt-muted hover:text-danger hover:bg-danger-soft transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-60">
        {/* Top bar */}
        <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-edge flex items-center justify-between px-8 sticky top-1 z-30">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-semibold text-txt">{pageTitle}</h1>
            <span className="hidden sm:inline-block h-5 w-px bg-edge" />
            <LiveClock />
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-page border border-edge rounded-xl px-1.5 py-1">
              <button onClick={zoomOut} className="p-1 rounded-lg text-txt-muted hover:text-primary hover:bg-primary-soft transition-colors" title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={resetZoom} className="min-w-[40px] text-center text-[11px] font-mono font-semibold text-txt-dim hover:text-primary transition-colors px-1" title="Reset zoom">
                {userZoom}%
              </button>
              <button onClick={zoomIn} className="p-1 rounded-lg text-txt-muted hover:text-primary hover:bg-primary-soft transition-colors" title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-page border border-edge hover:border-edge-strong transition-all text-sm text-txt-muted"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Search...</span>
                <kbd className="hidden sm:inline text-[9px] bg-card px-1.5 py-0.5 rounded border border-edge font-mono">⌘K</kbd>
              </button>

              {searchOpen && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-card border border-edge rounded-xl shadow-xl shadow-black/10 animate-scale-in z-50">
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-edge">
                    <Search className="w-4 h-4 text-txt-muted" />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search pages..."
                      className="flex-1 bg-transparent text-sm text-txt placeholder:text-txt-placeholder outline-none"
                    />
                    <button onClick={() => { setSearchOpen(false); setSearchQuery('') }} className="p-0.5 text-txt-muted hover:text-txt">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((r) => (
                        <button key={r.path}
                          onClick={() => { navigate(r.path); setSearchOpen(false); setSearchQuery('') }}
                          className="w-full text-left px-4 py-2.5 text-sm text-txt hover:bg-page flex items-center gap-2 transition-colors">
                          <ChevronRight className="w-3 h-3 text-txt-muted" />
                          {r.label}
                        </button>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <p className="text-xs text-txt-muted text-center py-4">No results</p>
                  ) : (
                    <p className="text-xs text-txt-muted text-center py-4">Type to search...</p>
                  )}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-page text-txt-muted hover:text-txt transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Notification Bell */}
            <button className="relative p-2 rounded-xl hover:bg-page text-txt-muted hover:text-txt transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-card" />
            </button>

            {/* Branch picker */}
            <div className="relative">
              <button
                onClick={() => setBranchOpen(!branchOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-page border border-edge hover:border-edge-strong transition-colors text-sm"
              >
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-medium text-txt-body">
                  {activeBranch?.name ?? 'Select branch'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-txt-muted" />
              </button>

              {branchOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-edge rounded-xl shadow-lg shadow-black/5 py-1 animate-slide-up z-50">
                  {branches.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setBranch(b)
                        setBranchOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        b.id === activeBranch?.id
                          ? 'bg-primary-soft text-primary font-medium'
                          : 'text-txt-dim hover:bg-page hover:text-txt'
                      }`}
                    >
                      {b.name}
                      <span className="ml-2 text-xs font-mono text-txt-muted">{b.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-page transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{initials}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-txt-muted" />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-card border border-edge rounded-xl shadow-lg shadow-black/5 py-1 animate-slide-up z-50">
                  <div className="px-4 py-3 border-b border-edge">
                    <p className="text-sm font-medium text-txt truncate">{user?.email}</p>
                    <p className="text-xs text-txt-muted">{ROLE_LABELS[user?.roleType ?? 1]}</p>
                  </div>
                  <button onClick={() => { setUserMenuOpen(false); navigate('/profile') }} className="w-full text-left px-4 py-2.5 text-sm text-txt-dim hover:bg-page hover:text-txt flex items-center gap-2 transition-colors">
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-danger hover:bg-danger-soft flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>

      {/* Click-away overlay */}
      {(branchOpen || userMenuOpen || searchOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setBranchOpen(false)
            setUserMenuOpen(false)
            setSearchOpen(false)
            setSearchQuery('')
          }}
        />
      )}
      </div>
    </div>
  )
}
