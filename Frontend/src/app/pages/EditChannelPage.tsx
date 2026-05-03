import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router";
import { Camera, Save } from "lucide-react";

export function EditChannelPage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    description: 'Путешествия по самым красивым местам планеты. Новые видео каждую неделю!',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name: formData.name });
    alert('Профиль успешно обновлен!');
    navigate('/channel/me');
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Требуется авторизация</h2>
        <p className="text-gray-600 dark:text-gray-400">Войдите в аккаунт для редактирования канала</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Редактирование канала</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Основная информация</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Аватар канала</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                  {formData.name[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Изменить фото
                  </button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Рекомендуется 800x800 px
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="channel-name" className="block text-sm font-medium mb-2">
                Название канала *
              </label>
              <input
                type="text"
                id="channel-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Введите название канала"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Описание канала
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Расскажите о вашем канале"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Оформление</h2>

          <div>
            <label className="block text-sm font-medium mb-3">Баннер канала</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="font-medium mb-1">Нажмите для загрузки баннера</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Рекомендуется 2560x1440 px
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Сохранить изменения
          </button>
          <button
            type="button"
            onClick={() => navigate('/channel/me')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
