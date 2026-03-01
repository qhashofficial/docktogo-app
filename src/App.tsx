import { Component, type ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ZoomProvider } from './context/ZoomContext'
import { ThemeProvider } from './context/ThemeContext'
import { BranchProvider } from './context/BranchContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import DashboardPage from './features/dashboard/DashboardPage'
import DockManagementPage from './features/docks/DockManagementPage'
import TransportsPage from './features/transports/TransportsPage'
import TransportDetailPage from './features/transports/TransportDetailPage'
import BranchesPage from './features/branches/BranchesPage'
import ProfilePage from './features/profile/ProfilePage'
import IntegrationsPage from './features/integrations/IntegrationsPage'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h1 style={{ color: '#EF4444' }}>Application Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#374151' }}>
            {this.state.error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#9CA3AF', fontSize: 12 }}>
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              background: '#6366F1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        element={
          <ProtectedRoute>
            <BranchProvider>
              <Layout />
            </BranchProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/docks" element={<DockManagementPage />} />
        <Route path="/transports" element={<TransportsPage />} />
        <Route path="/transports/:id" element={<TransportDetailPage />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ZoomProvider>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </ZoomProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
