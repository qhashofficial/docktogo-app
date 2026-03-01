import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./features/auth/LoginPage";
import Dashboard from "./features/dashboard/Dashboard";
import BranchesPage from "./features/branches/BranchesPage";
import DocksPage from "./features/docks/DocksPage";
import DockManagementPage from "./features/docks/DockManagementPage";
import TransportsPage from "./features/transports/TransportsPage";
import TransportDetailPage from "./features/transports/TransportDetailPage";
import Layout from "./components/Layout";
import { useAuth } from "./context/AuthContext";

function App() {
  const { accessToken, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/branches" element={<BranchesPage />} />
        <Route path="/docks" element={<DocksPage />} />
        <Route path="/docks/management" element={<DockManagementPage />} />
        <Route path="/transports" element={<TransportsPage />} />
        <Route path="/transports/:transportId" element={<TransportDetailPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
