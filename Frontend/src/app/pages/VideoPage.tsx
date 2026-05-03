import { useParams, useNavigate } from "react-router";
import { ThumbsUp, ThumbsDown, Share2, Flag } from "lucide-react";
import { useState } from "react";

const MOCK_VIDEO = {
  title: "Удивительные пейзажи: путешествие по горам Норвегии",
  views: "125,432",
  uploadDate: "2 дня назад",
  likes: "8.2K",
  dislikes: "124",
  author: "Travel Explorer",
  authorId: "travel-explorer",
  subscribers: "245K",
  description: "Присоединяйтесь ко мне в невероятном путешествии по величественным горам Норвегии. В этом видео мы исследуем самые живописные места, включая фьорды, водопады и древние тропы викингов.\n\nОборудование:\n- Камера: Sony A7 IV\n- Дрон: DJI Mavic 3\n- Музыка: Epidemic Sound",
};

const MOCK_COMMENTS = [
  { id: "1", author: "Nature Lover", avatar: "N", text: "Невероятные виды! Норвегия в моем списке мест, которые нужно посетить 🏔️", time: "1 день назад", likes: 45 },
  { id: "2", author: "Photo Master", avatar: "P", text: "Качество съемки на высоте! Какие настройки камеры использовали?", time: "2 дня назад", likes: 23 },
  { id: "3", author: "Adventure Seeker", avatar: "A", text: "Спасибо за вдохновение! Планирую поездку на следующее лето", time: "2 дня назад", likes: 12 },
];

export function VideoPage() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      console.log("Adding comment:", comment);
      setComment("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4">
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-6xl mb-2">▶️</div>
                <p>Video Player ({videoId})</p>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold mb-3">{MOCK_VIDEO.title}</h1>

          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {MOCK_VIDEO.views} просмотров • {MOCK_VIDEO.uploadDate}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <button
                  onClick={() => {
                    setIsLiked(!isLiked);
                    setIsDisliked(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    isLiked ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-medium">{MOCK_VIDEO.likes}</span>
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>
                <button
                  onClick={() => {
                    setIsDisliked(!isDisliked);
                    setIsLiked(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${
                    isDisliked ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                </button>
              </div>

              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Поделиться</span>
              </button>

              <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Flag className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4 mb-3">
              <div
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold cursor-pointer"
                onClick={() => navigate(`/channel/${MOCK_VIDEO.authorId}`)}
              >
                {MOCK_VIDEO.author[0]}
              </div>
              <div className="flex-1">
                <h3
                  className="font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                  onClick={() => navigate(`/channel/${MOCK_VIDEO.authorId}`)}
                >
                  {MOCK_VIDEO.author}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{MOCK_VIDEO.subscribers} подписчиков</p>
              </div>
              <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-colors">
                Подписаться
              </button>
            </div>
            <p className="text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
              {MOCK_VIDEO.description}
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Комментарии ({MOCK_COMMENTS.length})</h2>

            <form onSubmit={handleAddComment} className="flex gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold shrink-0">
                U
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Добавьте комментарий..."
                  className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 pb-2 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                />
                {comment && (
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setComment("")}
                      className="px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                    >
                      Отправить
                    </button>
                  </div>
                )}
              </div>
            </form>

            <div className="space-y-4">
              {MOCK_COMMENTS.map((c) => (
                <div key={c.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold shrink-0">
                    {c.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{c.author}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{c.time}</span>
                    </div>
                    <p className="mb-2">{c.text}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <button className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{c.likes}</span>
                      </button>
                      <button className="hover:text-blue-600 dark:hover:text-blue-400">
                        Ответить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <h3 className="font-semibold mb-4">Рекомендуемые видео</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-2 cursor-pointer group">
                <div className="w-40 aspect-video bg-gray-200 dark:bg-gray-800 rounded-lg shrink-0 overflow-hidden">
                  <img
                    src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000000}?w=160&h=90&fit=crop`}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Рекомендованное видео {i}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Channel Name</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">10K • 3 дня назад</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
