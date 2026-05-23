using VideoHosting.Application.DTOs;

namespace VideoHosting.Application.Interfaces;

public interface IVideoService
{
    Task<VideoDto?> GetVideoByIdAsync(Guid id);
    Task<IEnumerable<VideoDto>> GetAllVideosAsync();
    Task<IEnumerable<VideoDto>> GetVideosByUserIdAsync(Guid userId);
    Task<IEnumerable<VideoDto>> GetVideosByChannelIdAsync(Guid channelId);
    Task<IEnumerable<VideoDto>> GetPopularVideosAsync(int days = 7);
    Task<VideoDto> CreateVideoAsync(VideoDto video);
    Task UpdateVideoAsync(VideoDto video);
    Task DeleteVideoAsync(Guid id);
    
    Task DeleteVideoByAdminAsync(Guid id, Guid adminUserId, string reason);
    
    Task<VideoReactionDto?> GetUserReactionAsync(Guid userId, Guid videoId);
    Task AddOrUpdateReactionAsync(Guid userId, Guid videoId, string reactionType);
    Task RemoveReactionAsync(Guid userId, Guid videoId);
    
    Task<VideoProcessingStatusDto> GetVideoProcessingStatusAsync(Guid videoId);
    
    Task TrackVideoViewAsync(Guid userId, Guid videoId);
}