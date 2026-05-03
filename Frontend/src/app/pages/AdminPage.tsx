import { Shield, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface User {
  id: string;
  name: string;
  email: string;
  videoCount: number;
  joinDate: string;
}

const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Travel Explorer",
    email: "travel@example.com",
    videoCount: 6,
    joinDate: "3 месяца назад",
  },
  {
    id: "2",
    name: "Code Academy",
    email: "code@example.com",
    videoCount: 12,
    joinDate: "6 месяцев назад",
  },
  {
    id: "3",
    name: "Chef Studio",
    email: "chef@example.com",
    videoCount: 8,
    joinDate: "2 месяца назад",
  },
  {
    id: "4",
    name: "Wildlife Docs",
    email: "wildlife@example.com",
    videoCount: 15,
    joinDate: "1 год назад",
  },
  {
    id: "5",
    name: "Design Pro",
    email: "design@example.com",
    videoCount: 10,
    joinDate: "4 месяца назад",
  },
];

export function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold mb-4">Доступ запрещен</h2>
        <p className="text-gray-600 dark:text-gray-400">
          У вас нет прав для доступа к админ-панели
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <h1 className="text-3xl font-bold">Админ-панель</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Пользователи платформы</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Всего пользователей: {MOCK_USERS.length}
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {MOCK_USERS.map((u) => (
            <div
              key={u.id}
              onClick={() => navigate(`/admin/user/${u.id}`)}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {u.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{u.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{u.videoCount} видео</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{u.joinDate}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
