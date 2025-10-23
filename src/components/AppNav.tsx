import { useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "~/stores/authStore";
import { Waves, LogOut, Settings, Coins, DollarSign } from "lucide-react";

interface AppNavProps {
  currentPage?: "dashboard" | "boards" | "radars" | "strategy" | "canvas" | "pricing" | "credits" | "marketplace" | "challenges";
}

export function AppNav({ currentPage }: AppNavProps) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/" });
  };

  const navLinks = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard" },
    { id: "boards", label: "Boards", path: "/boards" },
    { id: "radars", label: "Radars", path: "/radars" },
    { id: "strategy", label: "Strategy", path: "/strategy" },
    { id: "canvas", label: "Canvas", path: "/strategy/canvas" },
    { id: "marketplace", label: "Marketplace", path: "/marketplace" },
    { id: "challenges", label: "Challenges", path: "/challenges" },
    { id: "pricing", label: "Pricing", path: "/pricing" },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate({ to: "/dashboard" })}
            >
              <div className="bg-blue-600 rounded-lg p-2">
                <Waves className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Blue Ocean Explorer
              </span>
            </div>
            <div className="flex items-center gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => navigate({ to: link.path })}
                  className={`font-medium ${
                    currentPage === link.id
                      ? "text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate({ to: "/credits" })}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentPage === "credits"
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
              title="Credits"
            >
              <Coins className="w-5 h-5" />
              <span className="text-sm">Credits</span>
            </button>
            <button
              onClick={() => navigate({ to: "/dashboard/preferences" })}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Preferences"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
