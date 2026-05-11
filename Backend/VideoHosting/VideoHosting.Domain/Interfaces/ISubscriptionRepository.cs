using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface ISubscriptionRepository
{
    Task<Subscription?> GetBySubscriberAndChannelAsync(Guid subscriberId, Guid channelId);
    Task<IEnumerable<Subscription>> GetSubscriptionsByUserAsync(Guid userId);
    Task<IEnumerable<Guid>> GetSubscriberIdsAsync(Guid channelId);
    Task<int> GetSubscriberCountAsync(Guid channelId);
    Task<Subscription> CreateAsync(Subscription subscription);
    Task DeleteAsync(Guid id);
    
    // Дополнительные методы для SubscriptionsController
    Task<IEnumerable<Subscription>> GetBySubscriberAsync(Guid subscriberId);
    Task<IEnumerable<Subscription>> GetByChannelAsync(Guid channelId);
}