using VideoHosting.Application.DTOs;

namespace VideoHosting.Application.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto?> GetUserByEmailAsync(string email);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<IEnumerable<UserDto>> SearchUsersAsync(string searchTerm);
    Task<UserDto> CreateUserAsync(UserDto user);
    Task UpdateUserAsync(UserDto user);
    Task DeleteUserAsync(Guid id);
    
    // Subscription methods
    Task<bool> SubscribeAsync(Guid subscriberId, Guid channelId);
    Task<bool> UnsubscribeAsync(Guid subscriberId, Guid channelId);
    Task<bool> IsSubscribedAsync(Guid subscriberId, Guid channelId);
    Task<int> GetSubscriberCountAsync(Guid channelId);
    Task<IEnumerable<UserDto>> GetUserSubscriptionsAsync(Guid userId);
    Task<IEnumerable<UserDto>> GetChannelSubscribersAsync(Guid channelId);
}