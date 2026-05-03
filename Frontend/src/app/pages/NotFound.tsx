import { Home } from "lucide-react";
import { useNavigate } from "react-router";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Страница не найдена</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Запрашиваемая страница не существует или была удалена
        </p>
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Home className="w-5 h-5" />
          На главную
        </button>
      </div>
    </div>
  );
}
