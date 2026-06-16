using VideoHosting.Application.DTOs;
using VideoHosting.Application.Services;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using Moq;
using Xunit;

namespace VideoHosting.Tests;

public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepository;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepository;
    private readonly UserService _service;

    public UserServiceTests()
    {
        _userRepository = new Mock<IUserRepository>();
        _subscriptionRepository = new Mock<ISubscriptionRepository>();
        _service = new UserService(_userRepository.Object, _subscriptionRepository.Object);
    }

    private User CreateUser(Guid? id = null)
    {
        return new User
        {
            Id = id ?? Guid.NewGuid(),
            Name = "TestUser",
            Email = "test@example.com",
            IsAdmin = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetUserByIdAsync_ReturnsUserWhenExists()
    {
        // Arrange
        var user = CreateUser();
        _userRepository.Setup(x => x.GetByIdAsync(user.Id)).ReturnsAsync(user);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(user.Id)).ReturnsAsync(3);

        // Act
        var result = await _service.GetUserByIdAsync(user.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.Id, result.Id);
        Assert.Equal(user.Name, result.Name);
        Assert.Equal(3, result.SubscribersCount);
    }

    [Fact]
    public async Task GetUserByIdAsync_ReturnsNullWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _userRepository.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((User?)null);

        // Act
        var result = await _service.GetUserByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserByEmailAsync_ReturnsUserWhenExists()
    {
        // Arrange
        var user = CreateUser();
        _userRepository.Setup(x => x.GetByEmailAsync(user.Email)).ReturnsAsync(user);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(user.Id)).ReturnsAsync(0);

        // Act
        var result = await _service.GetUserByEmailAsync(user.Email);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(user.Email, result.Email);
    }

    [Fact]
    public async Task GetUserByEmailAsync_ReturnsNullWhenNotFound()
    {
        // Arrange
        _userRepository.Setup(x => x.GetByEmailAsync("missing@example.com"))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _service.GetUserByEmailAsync("missing@example.com");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllUsersAsync_ReturnsAllUsers()
    {
        // Arrange
        var users = new List<User> { CreateUser(), CreateUser() };
        _userRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(users);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(It.IsAny<Guid>()))
            .ReturnsAsync(0);

        // Act
        var result = await _service.GetAllUsersAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task SearchUsersAsync_FindsByEmail()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), Name = "Alex", Email = "alex@test.com" },
            new User { Id = Guid.NewGuid(), Name = "Bob", Email = "bob@example.com" }
        };
        _userRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(users);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(It.IsAny<Guid>()))
            .ReturnsAsync(0);

        // Act
        var result = await _service.SearchUsersAsync("test.com");

        // Assert
        Assert.Single(result);
    }

    [Fact]
    public async Task UpdateUserAsync_UpdatesUser()
    {
        // Arrange
        var user = CreateUser();
        var userDto = new UserDto
        {
            Id = user.Id,
            Name = "UpdatedName",
            Email = "updated@example.com",
            Description = "New bio"
        };
        _userRepository.Setup(x => x.GetByIdAsync(user.Id)).ReturnsAsync(user);

        // Act
        await _service.UpdateUserAsync(userDto);

        // Assert
        _userRepository.Verify(x => x.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_ThrowsWhenNotFound()
    {
        // Arrange
        var userDto = new UserDto { Id = Guid.NewGuid(), Name = "Test" };
        _userRepository.Setup(x => x.GetByIdAsync(userDto.Id)).ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateUserAsync(userDto));
    }

    [Fact]
    public async Task SubscribeAsync_ReturnsFalseWhenSubscribingToSelf()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var result = await _service.SubscribeAsync(userId, userId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SubscribeAsync_ReturnsFalseWhenAlreadySubscribed()
    {
        // Arrange
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();
        _subscriptionRepository.Setup(
                x => x.GetBySubscriberAndChannelAsync(subscriberId, channelId))
            .ReturnsAsync(new Subscription { Id = Guid.NewGuid() });

        // Act
        var result = await _service.SubscribeAsync(subscriberId, channelId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task SubscribeAsync_CreatesSubscriptionWhenNotSubscribed()
    {
        // Arrange
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();
        _subscriptionRepository.Setup(
                x => x.GetBySubscriberAndChannelAsync(subscriberId, channelId))
            .ReturnsAsync((Subscription?)null);

        // Act
        var result = await _service.SubscribeAsync(subscriberId, channelId);

        // Assert
        Assert.True(result);
        _subscriptionRepository.Verify(
            x => x.CreateAsync(It.IsAny<Subscription>()), Times.Once);
    }

    [Fact]
    public async Task UnsubscribeAsync_ReturnsTrueAndDeletesSubscription()
    {
        // Arrange
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();
        var subscription = new Subscription { Id = Guid.NewGuid() };
        _subscriptionRepository.Setup(
                x => x.GetBySubscriberAndChannelAsync(subscriberId, channelId))
            .ReturnsAsync(subscription);

        // Act
        var result = await _service.UnsubscribeAsync(subscriberId, channelId);

        // Assert
        Assert.True(result);
        _subscriptionRepository.Verify(x => x.DeleteAsync(subscription.Id), Times.Once);
    }

    [Fact]
    public async Task UnsubscribeAsync_ReturnsFalseWhenNotSubscribed()
    {
        // Arrange
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();
        _subscriptionRepository.Setup(
                x => x.GetBySubscriberAndChannelAsync(subscriberId, channelId))
            .ReturnsAsync((Subscription?)null);

        // Act
        var result = await _service.UnsubscribeAsync(subscriberId, channelId);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task IsSubscribedAsync_ReturnsTrueWhenSubscribed()
    {
        // Arrange
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();
        _subscriptionRepository.Setup(
                x => x.GetBySubscriberAndChannelAsync(subscriberId, channelId))
            .ReturnsAsync(new Subscription { Id = Guid.NewGuid() });

        // Act
        var result = await _service.IsSubscribedAsync(subscriberId, channelId);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task IsSubscribedAsync_ReturnsFalseWhenNotSubscribed()
    {
        // Arrange
        var subscriberId = Guid.NewGuid();
        var channelId = Guid.NewGuid();
        _subscriptionRepository.Setup(
                x => x.GetBySubscriberAndChannelAsync(subscriberId, channelId))
            .ReturnsAsync((Subscription?)null);

        // Act
        var result = await _service.IsSubscribedAsync(subscriberId, channelId);

        // Assert
        Assert.False(result);
    }
}
