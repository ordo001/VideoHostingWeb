using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Application.Services;

public class VideoService : IVideoService
{
    private readonly IVideoRepository _videoRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMinioService _minioService;
    private readonly IRabbitMqService _rabbitMqService;

    public VideoService(
        IVideoRepository videoRepository,
        IUserRepository userRepository,
        IMinioService minioService,
        IRabbitMqService rabbitMqService)
    {
        _videoRepository = videoRepository;
        _userRepository = userRepository;
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

    private VideoDto MapToDto(Video video, User? user)
    {
        return new VideoDto
        {
            Id = video.Id,
            Title = video.Title,
            Description = video.Description,
            ThumbnailUrl = video.ThumbnailUrl,
            HlsUrl = video.HlsUrl,
            Duration = video.Duration,
            Views = video.Views,
            Likes = video.Likes,
            Dislikes = video.Dislikes,
            Status = video.Status,
            CreatedAt = video.CreatedAt,
            UpdatedAt = video.UpdatedAt,
            User = user != null ? new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Description = user.Description,
                IsAdmin = user.IsAdmin,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
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
}