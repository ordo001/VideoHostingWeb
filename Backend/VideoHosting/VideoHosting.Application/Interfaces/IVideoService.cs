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
}