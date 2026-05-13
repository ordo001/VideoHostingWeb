using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;

    public UserService(IUserRepository userRepository, ISubscriptionRepository subscriptionRepository)
    {
        _userRepository = userRepository;
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return null;

        return await MapToDtoAsync(user);
    }

    public async Task<UserDto?> GetUserByEmailAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
            return null;

        return await MapToDtoAsync(user);
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        var userDtos = new List<UserDto>();
        
        foreach (var user in users)
        {
            userDtos.Add(await MapToDtoAsync(user));
        }
        
        return userDtos;
    }
    
    public async Task<IEnumerable<UserDto>> SearchUsersAsync(string searchTerm)
    {
        var users = await _userRepository.GetAllAsync();
        var filteredUsers = users.Where(u => 
            u.Name.Contains(searchTerm, StringComparison.OrdinalIgnoreCase) ||
            u.Email.Contains(searchTerm, StringComparison.OrdinalIgnoreCase));
            
        var userDtos = new List<UserDto>();
        
        foreach (var user in filteredUsers)
        {
            userDtos.Add(await MapToDtoAsync(user));
        }
        
        return userDtos;
    }

    public async Task<UserDto> CreateUserAsync(UserDto userDto)
    {
        var user = MapToEntity(userDto);
        var createdUser = await _userRepository.CreateAsync(user);
        return await MapToDtoAsync(createdUser);
    }

    public async Task UpdateUserAsync(UserDto userDto)
    {
        var user = await _userRepository.GetByIdAsync(userDto.Id);
        if (user == null)
            throw new InvalidOperationException("Пользователь не найден");

        // Обновление полей
        user.Name = userDto.Name;
        user.Email = userDto.Email;
        user.AvatarUrl = userDto.AvatarUrl;
        user.Description = userDto.Description;
        user.IsAdmin = userDto.IsAdmin;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);
    }

    public async Task DeleteUserAsync(Guid id)
    {
        await _userRepository.DeleteAsync(id);
    }

    private UserDto MapToDto(User user, int subscribersCount = 0)
    {
        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Description = user.Description,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            SubscribersCount = subscribersCount
        };
    }

    private async Task<UserDto> MapToDtoAsync(User user)
    {
        var subscriberCount = await _subscriptionRepository.GetSubscriberCountAsync(user.Id);
        return MapToDto(user, subscriberCount);
    }

private User MapToEntity(UserDto userDto)
    {
        return new User
        {
            Id = userDto.Id,
            Name = userDto.Name,
            Email = userDto.Email,
            PasswordHash = string.Empty, // PasswordHash не хранится в DTO
            AvatarUrl = userDto.AvatarUrl,
            Description = userDto.Description,
            IsAdmin = userDto.IsAdmin,
            CreatedAt = userDto.CreatedAt,
            UpdatedAt = userDto.UpdatedAt
        };
    }
    
    public async Task<bool> SubscribeAsync(Guid subscriberId, Guid channelId)
    {
        // Проверяем, что пользователь не пытается подписаться на самого себя
        if (subscriberId == channelId)
        {
            return false;
        }
        
        // Проверяем, существует ли уже подписка
        var existingSubscription = await _subscriptionRepository.GetBySubscriberAndChannelAsync(subscriberId, channelId);
        if (existingSubscription != null)
        {
            return false; // Уже подписан
        }
        
        // Создаем новую подписку
        var subscription = new Subscription
        {
            Id = Guid.NewGuid(),
            SubscriberId = subscriberId,
            ChannelId = channelId,
            CreatedAt = DateTime.UtcNow
        };
        
        await _subscriptionRepository.CreateAsync(subscription);
        return true;
    }
    
    public async Task<bool> UnsubscribeAsync(Guid subscriberId, Guid channelId)
    {
        var subscription = await _subscriptionRepository.GetBySubscriberAndChannelAsync(subscriberId, channelId);
        if (subscription == null)
        {
            return false; // Нет подписки
        }
        
        await _subscriptionRepository.DeleteAsync(subscription.Id);
        return true;
    }
    
    public async Task<bool> IsSubscribedAsync(Guid subscriberId, Guid channelId)
    {
        var subscription = await _subscriptionRepository.GetBySubscriberAndChannelAsync(subscriberId, channelId);
        return subscription != null;
    }
    
    public async Task<int> GetSubscriberCountAsync(Guid channelId)
    {
        return await _subscriptionRepository.GetSubscriberCountAsync(channelId);
    }
    
    public async Task<IEnumerable<UserDto>> GetUserSubscriptionsAsync(Guid userId)
    {
        var subscriptions = await _subscriptionRepository.GetBySubscriberAsync(userId);
        var subscribedChannels = new List<UserDto>();
        
        foreach (var subscription in subscriptions)
        {
            var channel = await _userRepository.GetByIdAsync(subscription.ChannelId);
            if (channel != null)
            {
                // Получаем количество подписчиков для канала
                var subscriberCount = await _subscriptionRepository.GetSubscriberCountAsync(channel.Id);
                var channelDto = MapToDto(channel, subscriberCount);
                
                subscribedChannels.Add(channelDto);
            }
        }
        
        return subscribedChannels;
    }
    
    public async Task<IEnumerable<UserDto>> GetChannelSubscribersAsync(Guid channelId)
    {
        var subscriptions = await _subscriptionRepository.GetByChannelAsync(channelId);
        var subscribers = new List<UserDto>();
        
        foreach (var subscription in subscriptions)
        {
            var subscriber = await _userRepository.GetByIdAsync(subscription.SubscriberId);
            if (subscriber != null)
            {
                // Получаем количество подписчиков для пользователя
                var subscriberCount = await _subscriptionRepository.GetSubscriberCountAsync(subscriber.Id);
                var subscriberDto = MapToDto(subscriber, subscriberCount);
                
                subscribers.Add(subscriberDto);
            }
        }
        
        return subscribers;
    }
}