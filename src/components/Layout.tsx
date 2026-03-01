import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Container,
  Truck,
  ChevronDown,
  LogOut,
  User,
  Building2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useBranch } from '../context/BranchContext'
import { ROLE_LABELS } from '../types'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/docks', icon: Container, label: 'Dock Management' },
  { to: '/transports', icon: Truck, label: 'Transports' },
]

function SidebarLink({
  to,
  icon: Icon,
  label,
  expanded,
}: {
  to: string
  icon: typeof LayoutDashboard
  label: string
  expanded: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-brand/10 text-brand'
            : 'text-txt-dim hover:text-txt hover:bg-raised'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r-full" />
          )}
          <Icon className="w-5 h-5 shrink-0" />
          <span
            className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { branches, activeBranch, setBranch } = useBranch()
  const navigate = useNavigate()
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
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

  return (
    <div className="min-h-screen bg-void flex">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`fixed top-0 left-0 h-full z-40 bg-panel border-r border-edge flex flex-col transition-all duration-300 ease-out ${
          sidebarExpanded ? 'w-56' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-3 gap-2.5 border-b border-edge shrink-0">
          <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
            <Container className="w-5 h-5 text-brand" />
          </div>
          <span
            className={`font-display text-xl font-bold tracking-tight text-txt transition-all duration-200 ${
              sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            }`}
          >
            DTG
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => (
            <SidebarLink key={item.to} expanded={sidebarExpanded} {...item} />
          ))}
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-edge">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-txt-dim hover:text-status-canceled hover:bg-status-canceled/10 transition-all"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className={`text-sm font-medium transition-all duration-200 ${
                sidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-16">
        {/* Top bar */}
        <header className="h-16 bg-panel/80 backdrop-blur-xl border-b border-edge flex items-center justify-between px-6 sticky top-0 z-30">
          {/* Branch picker */}
          <div className="relative">
            <button
              onClick={() => setBranchOpen(!branchOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-raised border border-edge hover:border-edge-bright transition-colors"
            >
              <Building2 className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-txt">
                {activeBranch?.name ?? 'Select branch'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-txt-muted" />
            </button>

            {branchOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-elevated border border-edge rounded-xl shadow-2xl shadow-black/50 py-1 animate-slide-up">
                {branches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBranch(b)
                      setBranchOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      b.id === activeBranch?.id
                        ? 'bg-brand/10 text-brand'
                        : 'text-txt-dim hover:text-txt hover:bg-raised'
                    }`}
                  >
                    <span className="font-medium">{b.name}</span>
                    <span className="ml-2 text-xs font-mono text-txt-muted">{b.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User info */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-2 py-1 rounded-lg hover:bg-raised transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-txt leading-tight">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-txt-muted leading-tight">
                  {ROLE_LABELS[user?.roleType ?? 1]}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center">
                <span className="text-xs font-bold text-brand">{initials}</span>
              </div>
            </button>

            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-elevated border border-edge rounded-xl shadow-2xl shadow-black/50 py-1 animate-slide-up">
                <div className="px-4 py-3 border-b border-edge">
                  <p className="text-sm font-medium text-txt truncate">{user?.email}</p>
                </div>
                <button className="w-full text-left px-4 py-2.5 text-sm text-txt-dim hover:text-txt hover:bg-raised flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-status-canceled hover:bg-status-canceled/10 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay to close dropdowns */}
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
