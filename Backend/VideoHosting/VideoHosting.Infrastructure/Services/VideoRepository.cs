using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class VideoRepository : IVideoRepository
{
    private readonly VideoHostingDbContext _context;

    public VideoRepository(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task<Video?> GetByIdAsync(Guid id)
    {
        return await _context.Videos.FindAsync(id);
    }

    public async Task<IEnumerable<Video>> GetAllAsync()
    {
        return await _context.Videos.ToListAsync();
    }

    public async Task<IEnumerable<Video>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Videos.Where(v => v.UserId == userId).ToListAsync();
    }

    public async Task<Video> CreateAsync(Video video)
    {
        _context.Videos.Add(video);
        await _context.SaveChangesAsync();
        return video;
    }

    public async Task UpdateAsync(Video video)
    {
        _context.Videos.Update(video);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var video = await _context.Videos.FindAsync(id);
        if (video != null)
        {
            _context.Videos.Remove(video);
            await _context.SaveChangesAsync();
        }
    }
}