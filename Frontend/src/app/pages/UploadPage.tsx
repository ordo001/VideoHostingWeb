import { Upload, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

export function UploadPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Publishing video:", { formData, videoFile, thumbnailFile });
    alert("Видео успешно загружено!");
    navigate("/");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Загрузка видео</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3">Видеофайл *</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {videoFile ? (
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                    {videoFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium mb-1">Нажмите для выбора файла</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Или перетащите видео сюда
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Название видео *
          </label>
          <input
            type="text"
            id="title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Введите название видео"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Описание
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Расскажите зрителям о вашем видео"
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">Обложка (превью)</label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="hidden"
              id="thumbnail-upload"
            />
            <label htmlFor="thumbnail-upload" className="cursor-pointer">
              <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              {thumbnailFile ? (
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">
                    {thumbnailFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(thumbnailFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-medium mb-1">Выберите изображение</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Рекомендуется 1280x720 px
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={!videoFile || !formData.title}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
          >
            Опубликовать
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-8 py-3 border border-gray-300 dark:border-gray-700 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}
