using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class SubscriptionRepository : ISubscriptionRepository
{
    private readonly VideoHostingDbContext _context;

    public SubscriptionRepository(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task<Subscription?> GetBySubscriberAndChannelAsync(Guid subscriberId, Guid channelId)
    {
        return await _context.Subscriptions
            .FirstOrDefaultAsync(s => s.SubscriberId == subscriberId && s.ChannelId == channelId);
    }

    public async Task<IEnumerable<Subscription>> GetSubscriptionsByUserAsync(Guid userId)
    {
        return await _context.Subscriptions
            .Where(s => s.SubscriberId == userId)
            .ToListAsync();
    }

    public async Task<IEnumerable<Guid>> GetSubscriberIdsAsync(Guid channelId)
    {
        return await _context.Subscriptions
            .Where(s => s.ChannelId == channelId)
            .Select(s => s.SubscriberId)
            .ToListAsync();
    }

    public async Task<int> GetSubscriberCountAsync(Guid channelId)
    {
        return await _context.Subscriptions
            .CountAsync(s => s.ChannelId == channelId);
    }

    public async Task<Subscription> CreateAsync(Subscription subscription)
    {
        _context.Subscriptions.Add(subscription);
        await _context.SaveChangesAsync();
        return subscription;
    }

    public async Task DeleteAsync(Guid id)
    {
        var subscription = await _context.Subscriptions.FindAsync(id);
        if (subscription != null)
        {
            _context.Subscriptions.Remove(subscription);
            await _context.SaveChangesAsync();
        }
    }
    
    public async Task<IEnumerable<Subscription>> GetBySubscriberAsync(Guid subscriberId)
    {
        return await _context.Subscriptions
            .Where(s => s.SubscriberId == subscriberId)
            .ToListAsync();
    }
    
    public async Task<IEnumerable<Subscription>> GetByChannelAsync(Guid channelId)
    {
        return await _context.Subscriptions
            .Where(s => s.ChannelId == channelId)
            .ToListAsync();
    }
}