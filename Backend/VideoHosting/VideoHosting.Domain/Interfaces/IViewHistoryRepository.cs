using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface IViewHistoryRepository
{
    Task<ViewHistory?> GetByUserAndVideoAsync(Guid userId, Guid videoId);
    Task<IEnumerable<ViewHistory>> GetByUserIdAsync(Guid userId);
    Task<IEnumerable<ViewHistory>> GetByVideoIdAsync(Guid videoId);
    Task<IEnumerable<ViewHistory>> GetByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<int> GetCountByDateRangeAsync(DateTime startDate, DateTime endDate);
    Task<ViewHistory> CreateAsync(ViewHistory viewHistory);
    Task DeleteAsync(Guid id);
}