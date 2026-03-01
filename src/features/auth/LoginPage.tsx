import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle } from "lucide-react";
import BackgroundSlider from "../../components/BackgroundSlider";
import { useAuth } from "../../context/AuthContext";
import * as authApi from "../../api/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setAccessToken } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authApi.login(email, password);

      if (data.status !== "ok" || !data.data?.access_token) {
        setError(data.message ?? "Login failed");
        setLoading(false);
        return;
      }

      setAccessToken(data.data.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <BackgroundSlider />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-gray-200/60 backdrop-blur-md p-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md bg-white flex items-center justify-center border border-gray-200/80">
                <span className="text-[1.75rem] font-bold text-gray-700 tracking-tight">DTG</span>
              </div>
            </div>
            <h1 className="text-[1.5rem] font-semibold text-gray-900 mb-2 tracking-tight">
              Aware – docktogo.com
            </h1>
            <p className="text-[0.9375rem] text-gray-500">Sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[0.8125rem] font-semibold text-red-800">Login error</h4>
                  <p className="text-[0.8125rem] text-red-700 mt-1 leading-snug">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[0.875rem] font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3.5 text-[0.9375rem] border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.875rem] font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-14 py-3.5 text-[0.9375rem] border border-gray-300 rounded-xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 p-1 rounded hover:bg-gray-100 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-5 py-4 text-[0.9375rem] font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-[0.8125rem] text-gray-500">
            <p>© 2025 Patryk Skoczylas. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
