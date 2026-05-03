import { Home, Users, User, Shield } from "lucide-react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { icon: Home, label: "Главная", path: "/", show: true },
    { icon: Users, label: "Подписки", path: "/subscriptions", show: !!user },
    { icon: User, label: "Профиль", path: "/channel/me", show: !!user },
    { icon: Shield, label: "Админ", path: "/admin", show: !!user?.isAdmin },
  ];

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
      <nav className="p-3">
        {menuItems.filter(item => item.show).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? "bg-gray-100 dark:bg-gray-800 font-medium"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
