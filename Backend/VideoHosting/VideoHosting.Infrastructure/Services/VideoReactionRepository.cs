using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class VideoReactionRepository : IVideoReactionRepository
{
    private readonly VideoHostingDbContext _context;

    public VideoReactionRepository(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task<VideoReaction?> GetByUserAndVideoAsync(Guid userId, Guid videoId)
    {
        return await _context.VideoReactions
            .FirstOrDefaultAsync(vr => vr.UserId == userId && vr.VideoId == videoId);
    }

    public async Task<VideoReaction> CreateAsync(VideoReaction reaction)
    {
        _context.VideoReactions.Add(reaction);
        await _context.SaveChangesAsync();
        return reaction;
    }

    public async Task UpdateAsync(VideoReaction reaction)
    {
        _context.VideoReactions.Update(reaction);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var reaction = await _context.VideoReactions.FindAsync(id);
        if (reaction != null)
        {
            _context.VideoReactions.Remove(reaction);
            await _context.SaveChangesAsync();
        }
    }
}