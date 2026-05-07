using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface IVideoReactionRepository
{
    Task<VideoReaction?> GetByUserAndVideoAsync(Guid userId, Guid videoId);
    Task<VideoReaction> CreateAsync(VideoReaction reaction);
    Task UpdateAsync(VideoReaction reaction);
    Task DeleteAsync(Guid id);
}