using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class CommentRepository : ICommentRepository
{
    private readonly VideoHostingDbContext _context;
    
    public CommentRepository(VideoHostingDbContext context)
    {
        _context = context;
    }
    
    public async Task<Comment?> GetByIdAsync(Guid id)
    {
        return await _context.Comments
            .Include(c => c.User)
            .Include(c => c.Video)
            .FirstOrDefaultAsync(c => c.Id == id);
    }
    
    public async Task<IEnumerable<Comment>> GetByVideoIdAsync(Guid videoId, int limit, int offset)
    {
        return await _context.Comments
            .Where(c => c.VideoId == videoId)
            .Include(c => c.User)
            .OrderByDescending(c => c.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .ToListAsync();
    }
    
    public async Task<Comment> CreateAsync(Comment comment)
    {
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return comment;
    }
    
    public async Task UpdateAsync(Comment comment)
    {
        _context.Comments.Update(comment);
        await _context.SaveChangesAsync();
    }
    
    public async Task DeleteAsync(Guid id)
    {
        var comment = await _context.Comments.FindAsync(id);
        if (comment != null)
        {
            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();
        }
    }
    
    public async Task<int> GetCountByVideoIdAsync(Guid videoId)
    {
        return await _context.Comments
            .CountAsync(c => c.VideoId == videoId);
    }
}