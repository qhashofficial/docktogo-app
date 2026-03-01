import { useState } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Container,
  Truck,
  ChevronDown,
  LogOut,
  User,
  Building2,
  Settings,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { ROLE_LABELS } from '../types'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/docks', icon: Container, label: 'Dock Management' },
  { to: '/transports', icon: Truck, label: 'Transports' },
]

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/docks': 'Dock Management',
  '/transports': 'Transports',
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

export default function Layout() {
  const { user, logout } = useAuth()
  const { branches, activeBranch, setBranch } = useBranch()
  const navigate = useNavigate()
  const location = useLocation()
  const [branchOpen, setBranchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

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

  const pageTitle = PAGE_TITLES[location.pathname] || 'DockToGo'

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar — always expanded */}
      <aside className="fixed top-0 left-0 h-full w-60 bg-sidebar border-r border-edge flex flex-col z-40">
        {/* Brand */}
        <div className="h-16 flex items-center px-5 gap-3 border-b border-edge shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Container className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-display text-base font-bold text-txt tracking-tight">
              DockToGo
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

          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-txt-dim hover:bg-page hover:text-txt transition-all"
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* User card */}
        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-page">
            <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{initials}</span>
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
        <header className="h-16 bg-card/80 backdrop-blur-sm border-b border-edge flex items-center justify-between px-8 sticky top-0 z-30">
          <h1 className="font-display text-xl font-semibold text-txt">{pageTitle}</h1>

          <div className="flex items-center gap-3">
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
                <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{initials}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-txt-muted" />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-card border border-edge rounded-xl shadow-lg shadow-black/5 py-1 animate-slide-up z-50">
                  <div className="px-4 py-3 border-b border-edge">
                    <p className="text-sm font-medium text-txt truncate">{user?.email}</p>
                    <p className="text-xs text-txt-muted">{ROLE_LABELS[user?.roleType ?? 1]}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-txt-dim hover:bg-page hover:text-txt flex items-center gap-2 transition-colors">
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
      {(branchOpen || userMenuOpen) && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => {
            setBranchOpen(false)
            setUserMenuOpen(false)
          }}
        />
      )}
    </div>
  )
}
