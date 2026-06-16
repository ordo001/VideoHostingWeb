using VideoHosting.Application.DTOs;
using VideoHosting.Application.Services;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using Moq;
using Xunit;

namespace VideoHosting.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepository;
    private readonly Mock<IPasswordHasher> _passwordHasher;
    private readonly Mock<ITokenGenerator> _tokenGenerator;
    private readonly AuthService _service;

    public AuthServiceTests()
    {
        _userRepository = new Mock<IUserRepository>();
        _passwordHasher = new Mock<IPasswordHasher>();
        _tokenGenerator = new Mock<ITokenGenerator>();
        _service = new AuthService(_userRepository.Object, _passwordHasher.Object, _tokenGenerator.Object);
    }

    [Fact]
    public async Task RegisterAsync_ThrowsWhenEmailAlreadyExists()
    {
        // Arrange
        var request = new RegisterRequestDto { Name = "TestUser", Email = "test@example.com", Password = "Pass123!" };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email))
            .ReturnsAsync(new User { Email = request.Email });

        // Act & Assert
        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.RegisterAsync(request));
        Assert.Contains("email", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_SuccessWithValidCredentials_ReturnsAuthResponse()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@example.com", Password = "Pass123!" };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "TestUser",
            Email = request.Email,
            PasswordHash = "hashed-password",
            IsBanned = false
        };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email)).ReturnsAsync(user);
        _passwordHasher.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash)).Returns(true);
        _tokenGenerator.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("jwt-token");

        // Act
        var result = await _service.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("jwt-token", result.Token);
        Assert.Equal("TestUser", result.User.Name);
        _userRepository.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_ThrowsWhenUserNotFound()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "missing@example.com", Password = "Pass123!" };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email)).ReturnsAsync((User?)null);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.LoginAsync(request));
        Assert.Contains("Неверный", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_ThrowsWhenPasswordInvalid()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@example.com", Password = "WrongPass" };
        var user = new User
        {
            Email = request.Email,
            PasswordHash = "hashed-password",
            IsBanned = false
        };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email)).ReturnsAsync(user);
        _passwordHasher.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash)).Returns(false);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.LoginAsync(request));
    }

    [Fact]
    public async Task LoginAsync_ThrowsWhenUserBannedPermanently()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@example.com", Password = "Pass123!" };
        var user = new User
        {
            Email = request.Email,
            PasswordHash = "hashed-password",
            IsBanned = true,
            BannedUntil = null // Permanent ban
        };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email)).ReturnsAsync(user);
        _passwordHasher.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash)).Returns(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.LoginAsync(request));
        Assert.Contains("навсегда", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_ThrowsWhenTemporaryBanNotExpired()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@example.com", Password = "Pass123!" };
        var user = new User
        {
            Email = request.Email,
            PasswordHash = "hashed-password",
            IsBanned = true,
            BannedUntil = DateTime.UtcNow.AddHours(5) // Still active
        };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email)).ReturnsAsync(user);
        _passwordHasher.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash)).Returns(true);

        // Act & Assert
        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.LoginAsync(request));
        Assert.Contains("заблокирован до", exception.Message);
    }

    [Fact]
    public async Task LoginAsync_AutoUnbanWhenTemporaryBanExpired()
    {
        // Arrange
        var request = new LoginRequestDto { Email = "test@example.com", Password = "Pass123!" };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = "TestUser",
            Email = request.Email,
            PasswordHash = "hashed-password",
            IsBanned = true,
            BannedUntil = DateTime.UtcNow.AddHours(-1) // Expired
        };
        _userRepository.Setup(x => x.GetByEmailAsync(request.Email)).ReturnsAsync(user);
        _passwordHasher.Setup(x => x.VerifyPassword(request.Password, user.PasswordHash)).Returns(true);
        _tokenGenerator.Setup(x => x.GenerateToken(It.IsAny<User>())).Returns("jwt-token");

        // Act
        var result = await _service.LoginAsync(request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("jwt-token", result.Token);
        _userRepository.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.AtLeastOnce);
        Assert.False(user.IsBanned); // User was auto-unbanned
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsUserWhenExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Name = "TestUser",
            Email = "test@example.com",
            IsAdmin = true
        };
        _userRepository.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);

        // Act
        var result = await _service.GetCurrentUserAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.Id);
        Assert.Equal("TestUser", result.Name);
        Assert.True(result.IsAdmin);
    }

    [Fact]
    public async Task GetCurrentUserAsync_ThrowsWhenUserNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _userRepository.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.GetCurrentUserAsync(userId));
    }
}
