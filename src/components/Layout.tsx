import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, Building2, Truck, Package, LayoutGrid, LogOut, Sun, Moon, Monitor } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { useTheme } from "../context/ThemeContext";
import BranchPicker from "./BranchPicker";

const themeOptions: { value: "light" | "dark" | "system"; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "Jasny" },
  { value: "dark", icon: Moon, label: "Ciemny" },
  { value: "system", icon: Monitor, label: "System" },
];

const navItems = [
  { id: "dashboard", path: "/dashboard", name: "Dashboard", icon: BarChart3 },
  { id: "branches", path: "/branches", name: "Oddziały", icon: Building2 },
  { id: "docks-management", path: "/docks/management", name: "Zarządzanie rampami", icon: LayoutGrid },
  { id: "docks", path: "/docks", name: "Rampy", icon: Truck },
  { id: "transports", path: "/transports", name: "Transporty", icon: Package },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useAuth();
  const { selectedBranch } = useBranch();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isHoveringNav, setIsHoveringNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const topbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const setVar = () => {
      document.documentElement.style.setProperty("--topbar-h", `${el.getBoundingClientRect().height}px`);
    };
    setVar();
    const ro = new ResizeObserver(setVar);
    ro.observe(el);
    window.addEventListener("resize", setVar);
    return () => {
      window.removeEventListener("resize", setVar);
      ro.disconnect();
    };
  }, []);

  const activeTab = navItems.find((item) => location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path)))?.id ?? "dashboard";

  const handleTabChange = (path: string) => {
    navigate(path);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <div
        ref={topbarRef}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-3 py-1.5 fixed top-0 left-0 right-0 z-30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-md overflow-hidden shadow bg-white dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">DTG</span>
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">Aware - docktogo.com</h1>
              <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600" />
              <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 capitalize">
                {navItems.find((n) => n.id === activeTab)?.name ?? "Dashboard"}
              </span>
              {selectedBranch && (
                <>
                  <div className="hidden sm:block w-px h-4 bg-gray-300 dark:bg-gray-600" />
                  <span className="hidden sm:block text-xs text-gray-500 dark:text-gray-400">
                    {selectedBranch.name} ({selectedBranch.code})
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <BranchPicker />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1.5 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                  <span>{profile?.displayName?.charAt(0).toUpperCase() ?? profile?.email?.charAt(0).toUpperCase() ?? "?"}</span>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                  {profile?.displayName ?? profile?.email ?? "User"}
                </span>
              </button>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-10" aria-hidden onClick={() => setShowUserMenu(false)} />
                  <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1.5 z-50">
                    <div className="px-3 py-1.5 border-b border-gray-200 dark:border-gray-700">
                      <div className="font-medium text-gray-900 dark:text-white text-xs">{profile?.displayName ?? "User"}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{profile?.email}</div>
                    </div>
                    <div className="px-3 pt-1.5 pb-1.5 border-b border-gray-200 dark:border-gray-700">
                      <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Motyw</div>
                      <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-0.5">
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setTheme(option.value)}
                              className={`flex-1 flex items-center justify-center p-1 rounded transition-colors ${
                                theme === option.value
                                  ? "bg-blue-500 text-white shadow-sm"
                                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                              title={option.label}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate("/login", { replace: true });
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-full pt-[var(--topbar-h,44px)]">
        <div
          className={`relative transition-all duration-200 ${isMobile ? "w-12" : isHoveringNav ? "w-44" : "w-12"}`}
          onMouseEnter={() => !isMobile && setIsHoveringNav(true)}
          onMouseLeave={() => !isMobile && setIsHoveringNav(false)}
        >
          <div className="h-full bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transition-all duration-200 z-20 w-full">
            <nav className="flex-1 px-1.5 pt-1.5 pb-3 overflow-y-auto custom-scrollbar h-full">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (item.id !== "dashboard" && location.pathname.startsWith(item.path));
                const isExpanded = !isMobile && isHoveringNav;
                return (
                  <div key={item.id} className={`relative transition-all duration-300 ease-out ${index > 0 ? "mt-1" : ""}`}>
                    <button
                      type="button"
                      onClick={() => handleTabChange(item.path)}
                      className={`w-full h-8 flex items-center rounded-md transition-all duration-200 relative ${
                        isActive ? "bg-blue-500 text-white shadow" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      title={!isExpanded ? item.name : undefined}
                    >
                      <div className="absolute left-2 w-4 h-4 flex items-center justify-center">
                        <Icon className="w-4 h-4 flex-shrink-0" />
                      </div>
                      {isExpanded && (
                        <div className="ml-7 flex-1 min-w-0 text-left">
                          <span className="font-medium text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.name}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
