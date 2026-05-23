using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class ViewHistoryRepository : IViewHistoryRepository
{
    private readonly VideoHostingDbContext _context;

    public ViewHistoryRepository(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task<ViewHistory?> GetByUserAndVideoAsync(Guid userId, Guid videoId)
    {
        return await _context.ViewHistories
            .FirstOrDefaultAsync(vh => vh.UserId == userId && vh.VideoId == videoId);
    }

    public async Task<IEnumerable<ViewHistory>> GetByUserIdAsync(Guid userId)
    {
        return await _context.ViewHistories
            .Where(vh => vh.UserId == userId)
            .OrderByDescending(vh => vh.ViewedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ViewHistory>> GetByVideoIdAsync(Guid videoId)
    {
        return await _context.ViewHistories
            .Where(vh => vh.VideoId == videoId)
            .OrderByDescending(vh => vh.ViewedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ViewHistory>> GetByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.ViewHistories
            .Where(vh => vh.ViewedAt >= startDate && vh.ViewedAt <= endDate)
            .OrderByDescending(vh => vh.ViewedAt)
            .ToListAsync();
    }

    public async Task<int> GetCountByDateRangeAsync(DateTime startDate, DateTime endDate)
    {
        return await _context.ViewHistories
            .CountAsync(vh => vh.ViewedAt >= startDate && vh.ViewedAt <= endDate);
    }

    public async Task<ViewHistory> CreateAsync(ViewHistory viewHistory)
    {
        var entity = await _context.ViewHistories.AddAsync(viewHistory);
        await _context.SaveChangesAsync();
        return entity.Entity;
    }

    public async Task DeleteAsync(Guid id)
    {
        var viewHistory = await _context.ViewHistories.FindAsync(id);
        if (viewHistory != null)
        {
            _context.ViewHistories.Remove(viewHistory);
            await _context.SaveChangesAsync();
        }
    }
}