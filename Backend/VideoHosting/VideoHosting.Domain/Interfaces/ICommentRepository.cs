using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface ICommentRepository
{
    Task<Comment?> GetByIdAsync(Guid id);
    Task<IEnumerable<Comment>> GetByVideoIdAsync(Guid videoId, int limit, int offset);
    Task<Comment> CreateAsync(Comment comment);
    Task UpdateAsync(Comment comment);
    Task DeleteAsync(Guid id);
    Task<int> GetCountByVideoIdAsync(Guid videoId);
}