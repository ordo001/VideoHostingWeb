using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface IVideoRepository
{
    Task<Video?> GetByIdAsync(Guid id);
    Task<IEnumerable<Video>> GetAllAsync();
    Task<IEnumerable<Video>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<Video>> GetVideosByChannelIdAsync(Guid channelId);
    Task<IEnumerable<Video>> GetPopularVideosAsync(DateTime fromDateTime);
    Task<Video> CreateAsync(Video video);
    Task UpdateAsync(Video video);
    Task DeleteAsync(Guid id);
}