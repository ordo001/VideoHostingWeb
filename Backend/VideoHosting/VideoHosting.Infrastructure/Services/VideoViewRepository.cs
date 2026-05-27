using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class VideoViewRepository : IVideoViewRepository
{
    private readonly VideoHostingDbContext _context;

    public VideoViewRepository(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task<VideoView> CreateAsync(VideoView videoView)
    {
        _context.VideoViews.Add(videoView);
        await _context.SaveChangesAsync();
        return videoView;
    }

    public async Task<IEnumerable<VideoView>> GetByVideoIdAsync(Guid videoId)
    {
        return await _context.VideoViews
            .Where(vv => vv.VideoId == videoId)
            .ToListAsync();
    }

    public async Task<int> GetTotalViewsCountAsync()
    {
        return await _context.VideoViews.CountAsync();
    }

    public async Task<int> GetTodayViewsCountAsync()
    {
        var today = DateTime.UtcNow.Date;
        return await _context.VideoViews
            .CountAsync(vv => vv.ViewedAt.Date == today);
    }
}