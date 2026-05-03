import { useParams, useNavigate } from "react-router";
import { Settings } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import { useAuth } from "../context/AuthContext";

const CHANNEL_DATA = {
  name: "Travel Explorer",
  subscribers: "245K",
  videoCount: 124,
  description: "Путешествия по самым красивым местам планеты. Новые видео каждую неделю!",
};

const CHANNEL_VIDEOS = [
  {
    id: "1",
    thumbnail: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=400&h=225&fit=crop",
    duration: "12:34",
    title: "Удивительные пейзажи: путешествие по горам Норвегии",
    author: "Travel Explorer",
    authorId: "travel-explorer",
    uploadDate: "2 дня назад",
    views: "125K"
  },
  {
    id: "7",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop",
    duration: "14:56",
    title: "Горные озера Швейцарии: аэросъемка в 4K",
    author: "Travel Explorer",
    authorId: "travel-explorer",
    uploadDate: "1 неделю назад",
    views: "178K"
  },
  {
    id: "9",
    thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=225&fit=crop",
    duration: "18:22",
    title: "Исландия: земля огня и льда",
    author: "Travel Explorer",
    authorId: "travel-explorer",
    uploadDate: "2 недели назад",
    views: "312K"
  },
  {
    id: "10",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=225&fit=crop",
    duration: "16:45",
    title: "Альпийские луга в период цветения",
    author: "Travel Explorer",
    authorId: "travel-explorer",
    uploadDate: "3 недели назад",
    views: "89K"
  },
  {
    id: "11",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop",
    duration: "11:30",
    title: "Северное сияние в Лапландии",
    author: "Travel Explorer",
    authorId: "travel-explorer",
    uploadDate: "1 месяц назад",
    views: "456K"
  },
  {
    id: "12",
    thumbnail: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=225&fit=crop",
    duration: "13:18",
    title: "Тропические пляжи Таиланда",
    author: "Travel Explorer",
    authorId: "travel-explorer",
    uploadDate: "1 месяц назад",
    views: "234K"
  },
];

export function ChannelPage() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnChannel = channelId === 'me';

  const channelData = isOwnChannel && user ? {
    ...CHANNEL_DATA,
    name: user.name,
  } : CHANNEL_DATA;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-3xl">
            {channelData.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{channelData.name}</h1>
            <p className="text-white/90 mb-3">
              {channelData.subscribers} подписчиков • {channelData.videoCount} видео
            </p>
            <p className="text-white/80 text-sm mb-4 max-w-2xl">
              {channelData.description}
            </p>
            {isOwnChannel ? (
              <button
                onClick={() => navigate('/channel/edit')}
                className="flex items-center gap-2 px-6 py-2 bg-white text-blue-600 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Редактировать канал
              </button>
            ) : (
              <button className="px-6 py-2 bg-white text-blue-600 rounded-full font-medium hover:bg-gray-100 transition-colors">
                Подписаться
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-8">
            <button className="px-4 py-3 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 font-medium">
              Видео
            </button>
            <button className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
              О канале
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {CHANNEL_VIDEOS.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </div>
    </div>
  );
}
