import { VideoCard } from "../components/VideoCard";

const MOCK_VIDEOS = [
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
    id: "2",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=225&fit=crop",
    duration: "8:45",
    title: "Полный курс по React и TypeScript для начинающих",
    author: "Code Academy",
    authorId: "code-academy",
    uploadDate: "5 дней назад",
    views: "89K"
  },
  {
    id: "3",
    thumbnail: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400&h=225&fit=crop",
    duration: "15:22",
    title: "Закат на берегу океана - релаксация и медитация",
    author: "Mindful Life",
    authorId: "mindful-life",
    uploadDate: "1 неделю назад",
    views: "234K"
  },
  {
    id: "4",
    thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&h=225&fit=crop",
    duration: "6:18",
    title: "Лучшие рецепты итальянской пасты от шеф-повара",
    author: "Chef Studio",
    authorId: "chef-studio",
    uploadDate: "3 дня назад",
    views: "56K"
  },
  {
    id: "5",
    thumbnail: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400&h=225&fit=crop",
    duration: "20:15",
    title: "Дикая природа Африки: жизнь львиного прайда",
    author: "Wildlife Docs",
    authorId: "wildlife-docs",
    uploadDate: "4 дня назад",
    views: "412K"
  },
  {
    id: "6",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=225&fit=crop",
    duration: "10:03",
    title: "Основы UX/UI дизайна: создаем современный интерфейс",
    author: "Design Pro",
    authorId: "design-pro",
    uploadDate: "1 день назад",
    views: "67K"
  },
  {
    id: "7",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop",
    duration: "14:56",
    title: "Горные озера Швейцарии: аэросъемка в 4K",
    author: "Drone Views",
    authorId: "drone-views",
    uploadDate: "6 дней назад",
    views: "178K"
  },
  {
    id: "8",
    thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=225&fit=crop",
    duration: "9:27",
    title: "Эффективная работа в команде: советы и практики",
    author: "Business Insights",
    authorId: "business-insights",
    uploadDate: "2 недели назад",
    views: "92K"
  },
];

export function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Рекомендации</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOCK_VIDEOS.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
      </div>
    </div>
  );
}
