import { useNavigate } from "react-router";

interface VideoCardProps {
  id: string;
  thumbnail: string;
  duration: string;
  title: string;
  author: string;
  authorId: string;
  uploadDate: string;
  views?: string;
}

export function VideoCard({ id, thumbnail, duration, title, author, authorId, uploadDate, views }: VideoCardProps) {
  const navigate = useNavigate();

  return (
    <div className="group cursor-pointer" onClick={() => navigate(`/watch/${id}`)}>
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 mb-3">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
          {duration}
        </div>
      </div>

      <div className="flex gap-3">
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/channel/${authorId}`);
          }}
        >
          {author[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium line-clamp-2 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {title}
          </h3>
          <p
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/channel/${authorId}`);
            }}
          >
            {author}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {views && `${views} • `}{uploadDate}
          </p>
        </div>
      </div>
    </div>
  );
}
