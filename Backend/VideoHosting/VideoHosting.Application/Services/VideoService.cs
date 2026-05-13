using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Enums;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Application.Services;

public class VideoService : IVideoService
{
    private readonly IVideoRepository _videoRepository;
    private readonly IVideoReactionRepository _videoReactionRepository;
    private readonly IUserRepository _userRepository;
    private readonly IAdminActionLogRepository _adminActionLogRepository;
    private readonly IMinioService _minioService;
    private readonly IRabbitMqService _rabbitMqService;
    private static readonly HashSet<string> ValidReactionTypes = new() { "Like", "Dislike" };
    private static readonly List<string> SupportedResolutions = new() { "360p", "480p", "720p", "1080p" };

    public VideoService(
        IVideoRepository videoRepository,
        IVideoReactionRepository videoReactionRepository,
        IUserRepository userRepository,
        IAdminActionLogRepository adminActionLogRepository,
        IMinioService minioService,
        IRabbitMqService rabbitMqService)
    {
        _videoRepository = videoRepository;
        _videoReactionRepository = videoReactionRepository;
        _userRepository = userRepository;
        _adminActionLogRepository = adminActionLogRepository;
        _minioService = minioService;
        _rabbitMqService = rabbitMqService;
    }

    public async Task<VideoDto?> GetVideoByIdAsync(Guid id)
    {
        var video = await _videoRepository.GetByIdAsync(id);
        if (video == null)
            return null;

        var user = await _userRepository.GetByIdAsync(video.UserId);
        return MapToDto(video, user);
    }

    public async Task<IEnumerable<VideoDto>> GetAllVideosAsync()
    {
        var videos = await _videoRepository.GetAllAsync();
        var videoDtos = new List<VideoDto>();

        foreach (var video in videos)
        {
            var user = await _userRepository.GetByIdAsync(video.UserId);
            videoDtos.Add(MapToDto(video, user));
        }

        return videoDtos;
    }

    public async Task<IEnumerable<VideoDto>> GetVideosByUserIdAsync(Guid userId)
    {
        var videos = await _videoRepository.GetByUserIdAsync(userId);
        var videoDtos = new List<VideoDto>();

        foreach (var video in videos)
        {
            var user = await _userRepository.GetByIdAsync(video.UserId);
            videoDtos.Add(MapToDto(video, user));
        }

        return videoDtos;
    }

    public async Task<VideoDto> CreateVideoAsync(VideoDto videoDto)
    {
        var video = MapToEntity(videoDto);
        var createdVideo = await _videoRepository.CreateAsync(video);

        var user = await _userRepository.GetByIdAsync(createdVideo.UserId);
        return MapToDto(createdVideo, user);
    }

    public async Task UpdateVideoAsync(VideoDto videoDto)
    {
        var video = await _videoRepository.GetByIdAsync(videoDto.Id);
        if (video == null)
            throw new InvalidOperationException("Видео не найдено");

        // Обновление полей
        video.Title = videoDto.Title;
        video.Description = videoDto.Description;
        video.ThumbnailUrl = videoDto.ThumbnailUrl;
        video.HlsUrl = videoDto.HlsUrl;
        video.Duration = videoDto.Duration;
        video.Views = videoDto.Views;
        video.Likes = videoDto.Likes;
        video.Dislikes = videoDto.Dislikes;
        video.Status = videoDto.Status;
        video.UpdatedAt = DateTime.UtcNow;

        await _videoRepository.UpdateAsync(video);
    }

    public async Task DeleteVideoAsync(Guid id)
    {
        var video = await _videoRepository.GetByIdAsync(id);
        if (video == null)
            throw new InvalidOperationException("Видео не найдено");

        // Удаление видео из хранилища
        if (!string.IsNullOrEmpty(video.OriginalVideoUrl))
        {
            await _minioService.DeleteVideoAsync(video.OriginalVideoUrl);
        }

        if (!string.IsNullOrEmpty(video.ThumbnailUrl))
        {
            await _minioService.DeleteThumbnailAsync(video.ThumbnailUrl);
        }

        await _videoRepository.DeleteAsync(id);
    }
    
    public async Task DeleteVideoByAdminAsync(Guid id, Guid adminUserId, string reason)
    {
        // Удаляем видео стандартным способом
        await DeleteVideoAsync(id);
        
        // Создаем запись в логе административных действий
        var log = new AdminActionLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            Action = "DeleteVideo",
            TargetType = "Video",
            TargetId = id,
            Reason = reason,
            CreatedAt = DateTime.UtcNow
        };
        
        await _adminActionLogRepository.CreateAsync(log);
    }

    private VideoDto MapToDto(Video video, User? user)
    {
        return new VideoDto
        {
            Id = video.Id,
            Title = video.Title,
            Description = video.Description,
            ThumbnailUrl = video.ThumbnailUrl,
            OriginalVideoUrl = video.OriginalVideoUrl,
            HlsUrl = video.HlsUrl,
            Duration = video.Duration,
            Views = video.Views,
            Likes = video.Likes,
            Dislikes = video.Dislikes,
            Status = video.Status,
            CreatedAt = video.CreatedAt,
            UpdatedAt = video.UpdatedAt,
            IsLiked = false,  // По умолчанию, нужно будет заполнить в контроллере
            IsDisliked = false,  // По умолчанию, нужно будет заполнить в контроллере
            IsSubscribed = false,  // По умолчанию, нужно будет заполнить в контроллере
            User = user != null ? new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Description = user.Description,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                SubscribersCount = 0  // По умолчанию, будет заполнено позже
            } : null!
        };
    }

    private Video MapToEntity(VideoDto videoDto)
    {
        return new Video
        {
            Id = videoDto.Id,
            Title = videoDto.Title,
            Description = videoDto.Description,
            ThumbnailUrl = videoDto.ThumbnailUrl,
            OriginalVideoUrl = videoDto.OriginalVideoUrl,
            HlsUrl = videoDto.HlsUrl,
            Duration = videoDto.Duration,
            Views = videoDto.Views,
            Likes = videoDto.Likes,
            Dislikes = videoDto.Dislikes,
            Status = videoDto.Status,
            UserId = videoDto.User.Id,
            CreatedAt = videoDto.CreatedAt,
            UpdatedAt = videoDto.UpdatedAt
        };
    }
    
    public async Task<VideoReactionDto?> GetUserReactionAsync(Guid userId, Guid videoId)
    {
        var reaction = await _videoReactionRepository.GetByUserAndVideoAsync(userId, videoId);
        if (reaction == null)
            return null;

        return new VideoReactionDto
        {
            Id = reaction.Id,
            UserId = reaction.UserId,
            VideoId = reaction.VideoId,
            ReactionType = reaction.ReactionType.ToString(),
            CreatedAt = reaction.CreatedAt
        };
    }

    public async Task AddOrUpdateReactionAsync(Guid userId, Guid videoId, string reactionType)
    {
        // Валидация типа реакции
        if (!ValidReactionTypes.Contains(reactionType))
            throw new ArgumentException("Invalid reaction type", nameof(reactionType));
        
        var existingReaction = await _videoReactionRepository.GetByUserAndVideoAsync(userId, videoId);
        
        if (existingReaction != null)
        {
            var oldReactionType = existingReaction.ReactionType.ToString();
            
            // Если пользователь уже ставил такую же реакцию, ничего не делаем
            if (oldReactionType == reactionType)
                return;
            
            // Обновляем тип реакции
            existingReaction.ReactionType = (ReactionType)Enum.Parse(typeof(ReactionType), reactionType);
            existingReaction.UpdatedAt = DateTime.UtcNow;
            await _videoReactionRepository.UpdateAsync(existingReaction);
            
            // Обновляем счетчики лайков/дизлайков у видео
            await UpdateVideoReactionCounters(videoId, oldReactionType, reactionType);
        }
        else
        {
            // Создаем новую реакцию
            var reaction = new VideoReaction
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                VideoId = videoId,
                ReactionType = (ReactionType)Enum.Parse(typeof(ReactionType), reactionType),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _videoReactionRepository.CreateAsync(reaction);
            
            // Обновляем счетчики лайков/дизлайков у видео
            await UpdateVideoReactionCounters(videoId, null, reactionType);
        }
    }

    public async Task RemoveReactionAsync(Guid userId, Guid videoId)
    {
        var existingReaction = await _videoReactionRepository.GetByUserAndVideoAsync(userId, videoId);
        if (existingReaction != null)
        {
            var reactionType = existingReaction.ReactionType.ToString();
            
            // Удаляем реакцию
            await _videoReactionRepository.DeleteAsync(existingReaction.Id);
            
            // Обновляем счетчики лайков/дизлайков у видео
            await UpdateVideoReactionCounters(videoId, reactionType, null);
        }
    }
    
    private async Task UpdateVideoReactionCounters(Guid videoId, string? oldReactionType, string? newReactionType)
    {
        var video = await _videoRepository.GetByIdAsync(videoId);
        if (video == null)
            throw new InvalidOperationException("Видео не найдено");
        
        // Уменьшаем счетчик старой реакции
        if (oldReactionType == "Like")
            video.Likes = Math.Max(0, video.Likes - 1);
        else if (oldReactionType == "Dislike")
            video.Dislikes = Math.Max(0, video.Dislikes - 1);
        
        // Увеличиваем счетчик новой реакции
        if (newReactionType == "Like")
            video.Likes++;
        else if (newReactionType == "Dislike")
            video.Dislikes++;
        
        await _videoRepository.UpdateAsync(video);
    }
    
    public async Task<VideoProcessingStatusDto> GetVideoProcessingStatusAsync(Guid videoId)
    {
        var video = await _videoRepository.GetByIdAsync(videoId);
        if (video == null)
            throw new InvalidOperationException("Видео не найдено");

        var statusDto = new VideoProcessingStatusDto
        {
            Status = video.Status.ToLowerInvariant(),
            Progress = 0,
            Resolutions = new List<string>()
        };

        // Если видео обработано, добавляем доступные разрешения
        if (video.Status.Equals("ready", StringComparison.OrdinalIgnoreCase))
        {
            statusDto.Progress = 100;
            statusDto.Resolutions = SupportedResolutions;
        }
        // Если видео в процессе обработки, можем добавить примерный прогресс (в реальной системе это будет более точно)
        else if (video.Status.Equals("processing", StringComparison.OrdinalIgnoreCase))
        {
            // Здесь мог бы быть код для получения точного прогресса из какой-либо системы отслеживания
            // Пока что возвращаем 0, так как точный прогресс требует дополнительной реализации
            statusDto.Progress = 0;
        }
        // Если видео не удалось обработать, добавляем сообщение об ошибке
        else if (video.Status.Equals("failed", StringComparison.OrdinalIgnoreCase))
        {
            statusDto.ErrorMessage = "Не удалось обработать видео";
        }

        return statusDto;
    }
}