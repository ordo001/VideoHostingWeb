using VideoHosting.Application.DTOs;
using VideoHosting.Application.Services;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using Moq;
using Xunit;

namespace VideoHosting.Tests;

public class CommentServiceTests
{
    private readonly Mock<ICommentRepository> _commentRepository;
    private readonly Mock<IUserRepository> _userRepository;
    private readonly Mock<IVideoRepository> _videoRepository;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepository;
    private readonly CommentService _service;

    public CommentServiceTests()
    {
        _commentRepository = new Mock<ICommentRepository>();
        _userRepository = new Mock<IUserRepository>();
        _videoRepository = new Mock<IVideoRepository>();
        _subscriptionRepository = new Mock<ISubscriptionRepository>();
        _service = new CommentService(
            _commentRepository.Object,
            _userRepository.Object,
            _videoRepository.Object,
            _subscriptionRepository.Object);
    }

    private Comment CreateComment(Guid? id = null, Guid? userId = null, Guid? videoId = null)
    {
        return new Comment
        {
            Id = id ?? Guid.NewGuid(),
            Text = "Test comment",
            UserId = userId ?? Guid.NewGuid(),
            VideoId = videoId ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
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

    private Video CreateVideo(Guid? id = null)
    {
        return new Video
        {
            Id = id ?? Guid.NewGuid(),
            Title = "Test Video",
            UserId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
    }

    [Fact]
    public async Task GetCommentByIdAsync_ReturnsCommentWhenExists()
    {
        // Arrange
        var user = CreateUser();
        var comment = CreateComment(userId: user.Id);
        comment.User = user;
        _commentRepository.Setup(x => x.GetByIdAsync(comment.Id)).ReturnsAsync(comment);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(user.Id)).ReturnsAsync(0);

        // Act
        var result = await _service.GetCommentByIdAsync(comment.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(comment.Id, result.Id);
        Assert.Equal(comment.Text, result.Text);
    }

    [Fact]
    public async Task GetCommentByIdAsync_ReturnsNullWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _commentRepository.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Comment?)null);

        // Act
        var result = await _service.GetCommentByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetCommentsByVideoIdAsync_ReturnsComments()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var user = CreateUser();
        var comments = new List<Comment>
        {
            new Comment
            {
                UserId = user.Id,
                VideoId = videoId,
                User = user
            },
            new Comment
            {
            UserId = user.Id,
            VideoId = videoId,
            User = user
            }
        };
        _commentRepository.Setup(x => x.GetByVideoIdAsync(videoId, 20, 0)).ReturnsAsync(comments);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(user.Id)).ReturnsAsync(0);

        // Act
        var result = await _service.GetCommentsByVideoIdAsync(videoId);

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task CreateCommentAsync_SuccessWhenVideoAndUserExist()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        var user = CreateUser(userId);
        var createDto = new CreateCommentDto { Text = "New comment" };
        var createdComment = CreateComment(userId: userId, videoId: videoId);
        createdComment.Text = createDto.Text;

        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);
        _userRepository.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync(user);
        _commentRepository.Setup(x => x.CreateAsync(It.IsAny<Comment>())).ReturnsAsync((Comment c) => c);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(userId)).ReturnsAsync(0);

        // Act
        var result = await _service.CreateCommentAsync(videoId, userId, createDto);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New comment", result.Text);
        _commentRepository.Verify(x => x.CreateAsync(It.IsAny<Comment>()), Times.Once);
    }

    [Fact]
    public async Task CreateCommentAsync_ThrowsWhenVideoNotFound()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var createDto = new CreateCommentDto { Text = "Comment" };
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync((Video?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateCommentAsync(videoId, userId, createDto));
    }

    [Fact]
    public async Task CreateCommentAsync_ThrowsWhenUserNotFound()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var createDto = new CreateCommentDto { Text = "Comment" };
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(CreateVideo(videoId));
        _userRepository.Setup(x => x.GetByIdAsync(userId)).ReturnsAsync((User?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreateCommentAsync(videoId, userId, createDto));
    }

    [Fact]
    public async Task UpdateCommentAsync_SuccessWhenOwner()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var comment = CreateComment(userId: userId);
        var updateDto = new UpdateCommentDto { Text = "Updated text" };
        _commentRepository.Setup(x => x.GetByIdAsync(comment.Id)).ReturnsAsync(comment);

        // Act
        var result = await _service.UpdateCommentAsync(comment.Id, userId, updateDto);

        // Assert
        Assert.True(result);
        _commentRepository.Verify(x => x.UpdateAsync(comment), Times.Once);
    }

    [Fact]
    public async Task UpdateCommentAsync_ThrowsWhenNotOwner()
    {
        // Arrange
        var comment = CreateComment(userId: Guid.NewGuid());
        var updateDto = new UpdateCommentDto { Text = "Updated" };
        _commentRepository.Setup(x => x.GetByIdAsync(comment.Id)).ReturnsAsync(comment);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.UpdateCommentAsync(comment.Id, Guid.NewGuid(), updateDto));
    }

    [Fact]
    public async Task UpdateCommentAsync_ReturnsFalseWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        var updateDto = new UpdateCommentDto { Text = "Updated" };
        _commentRepository.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Comment?)null);

        // Act
        var result = await _service.UpdateCommentAsync(id, Guid.NewGuid(), updateDto);

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task DeleteCommentAsync_SuccessWhenOwner()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var comment = CreateComment(userId: userId);
        _commentRepository.Setup(x => x.GetByIdAsync(comment.Id)).ReturnsAsync(comment);

        // Act
        var result = await _service.DeleteCommentAsync(comment.Id, userId);

        // Assert
        Assert.True(result);
        _commentRepository.Verify(x => x.DeleteAsync(comment.Id), Times.Once);
    }

    [Fact]
    public async Task DeleteCommentAsync_ThrowsWhenNotOwner()
    {
        // Arrange
        var comment = CreateComment(userId: Guid.NewGuid());
        _commentRepository.Setup(x => x.GetByIdAsync(comment.Id)).ReturnsAsync(comment);

        // Act & Assert
        await Assert.ThrowsAsync<UnauthorizedAccessException>(
            () => _service.DeleteCommentAsync(comment.Id, Guid.NewGuid()));
    }

    [Fact]
    public async Task DeleteCommentAsync_ReturnsFalseWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _commentRepository.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Comment?)null);

        // Act
        var result = await _service.DeleteCommentAsync(id, Guid.NewGuid());

        // Assert
        Assert.False(result);
    }

    [Fact]
    public async Task GetCommentCountByVideoIdAsync_ReturnsCount()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        _commentRepository.Setup(x => x.GetCountByVideoIdAsync(videoId)).ReturnsAsync(42);

        // Act
        var result = await _service.GetCommentCountByVideoIdAsync(videoId);

        // Assert
        Assert.Equal(42, result);
    }
}
