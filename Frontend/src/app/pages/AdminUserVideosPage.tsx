import { Trash2, ArrowLeft, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  views: string;
  uploadDate: string;
  duration: string;
}

const MOCK_USER_DATA: Record<string, { name: string; email: string; videos: Video[] }> = {
  "1": {
    name: "Travel Explorer",
    email: "travel@example.com",
    videos: [
      { id: "v1", title: "Удивительные пейзажи: путешествие по горам Норвегии", thumbnail: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&h=225&fit=crop", views: "125K", uploadDate: "2 дня назад", duration: "12:34" },
      { id: "v2", title: "Горные озера Швейцарии: аэросъемка в 4K", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop", views: "178K", uploadDate: "1 неделю назад", duration: "14:56" },
    ],
  },
  "2": {
    name: "Code Academy",
    email: "code@example.com",
    videos: [
      { id: "v3", title: "Полный курс по React и TypeScript для начинающих", thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop", views: "89K", uploadDate: "5 дней назад", duration: "8:45" },
    ],
  },
};

const DELETE_REASONS = [
  "Нарушение авторских прав",
  "Неприемлемый контент",
  "Спам или обман",
  "Насилие или угрозы",
  "Другое",
];

export function AdminUserVideosPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteModal, setDeleteModal] = useState<{ videoId: string; videoTitle: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState("");

  const userData = userId ? MOCK_USER_DATA[userId] : null;

  const handleDeleteVideo = () => {
    if (!deleteReason) {
      alert("Выберите причину удаления");
      return;
    }
    console.log("Deleting video:", deleteModal, "Reason:", deleteReason);
    alert(`Видео "${deleteModal?.videoTitle}" удалено. Причина: ${deleteReason}`);
    setDeleteModal(null);
    setDeleteReason("");
  };

  if (!user?.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h2 className="text-2xl font-semibold mb-4">Доступ запрещен</h2>
        <p className="text-gray-600 dark:text-gray-400">
          У вас нет прав для доступа к этой странице
        </p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Пользователь не найден</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к списку пользователей
      </button>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
            {userData.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userData.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{userData.email}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {userData.videos.length} видео на канале
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          <h2 className="text-lg font-semibold">Видео пользователя</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Нажмите на кнопку удаления для модерации контента
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {userData.videos.map((video) => (
            <div key={video.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="relative w-48 aspect-video rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 shrink-0">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                    {video.duration}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {video.views} просмотров • {video.uploadDate}
                  </p>
                </div>

                <button
                  onClick={() => setDeleteModal({ videoId: video.id, videoTitle: video.title })}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold">Удаление видео</h2>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Вы уверены, что хотите удалить видео:
            </p>
            <p className="font-medium mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {deleteModal.videoTitle}
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Причина удаления *</label>
              <select
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Выберите причину</option>
                {DELETE_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteVideo}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => {
                  setDeleteModal(null);
                  setDeleteReason("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
