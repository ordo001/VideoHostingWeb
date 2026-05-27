using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface IVideoViewRepository
{
    Task<VideoView> CreateAsync(VideoView videoView);
    Task<IEnumerable<VideoView>> GetByVideoIdAsync(Guid videoId);
    Task<int> GetTotalViewsCountAsync();
    Task<int> GetTodayViewsCountAsync();
}