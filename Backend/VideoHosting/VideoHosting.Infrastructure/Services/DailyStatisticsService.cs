using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class DailyStatisticsService
{
    private readonly VideoHostingDbContext _context;

    public DailyStatisticsService(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task UpdateDailyStatisticsAsync()
    {
        var today = DateTime.UtcNow.Date;
        
        // Получаем запись за сегодня или создаем новую
        var dailyStats = await _context.DailyStatistics
            .FirstOrDefaultAsync(ds => ds.Date == today);
            
        if (dailyStats == null)
        {
            dailyStats = new DailyStatistics
            {
                Id = Guid.NewGuid(),
                Date = today,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.DailyStatistics.Add(dailyStats);
        }
        
        // Подсчитываем новые значения за сегодня
        var yesterday = today.AddDays(-1);
        
        dailyStats.NewUsers = await _context.Users
            .CountAsync(u => u.CreatedAt >= today && u.CreatedAt < today.AddDays(1));
            
        dailyStats.NewVideos = await _context.Videos
            .CountAsync(v => v.CreatedAt >= today && v.CreatedAt < today.AddDays(1));
            
        dailyStats.NewViews = await _context.Videos
            .Where(v => v.CreatedAt >= today && v.CreatedAt < today.AddDays(1))
            .SumAsync(v => (int?)v.Views) ?? 0;
            
        dailyStats.NewLikes = await _context.Videos
            .Where(v => v.CreatedAt >= today && v.CreatedAt < today.AddDays(1))
            .SumAsync(v => (int?)v.Likes) ?? 0;
            
        dailyStats.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
    }
}