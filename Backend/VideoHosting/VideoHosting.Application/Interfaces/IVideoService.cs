using VideoHosting.Application.DTOs;

namespace VideoHosting.Application.Interfaces;

public interface IVideoService
{
    Task<VideoDto?> GetVideoByIdAsync(Guid id);
    Task<IEnumerable<VideoDto>> GetAllVideosAsync();
    Task<IEnumerable<VideoDto>> GetVideosByUserIdAsync(Guid userId);
    Task<VideoDto> CreateVideoAsync(VideoDto video);
    Task UpdateVideoAsync(VideoDto video);
    Task DeleteVideoAsync(Guid id);
    
    // Admin functions
    Task DeleteVideoByAdminAsync(Guid id, Guid adminUserId, string reason);
    
    // Video reactions
    Task<VideoReactionDto?> GetUserReactionAsync(Guid userId, Guid videoId);
    Task AddOrUpdateReactionAsync(Guid userId, Guid videoId, string reactionType);
    Task RemoveReactionAsync(Guid userId, Guid videoId);
}