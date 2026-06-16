using VideoHosting.Application.DTOs;
using VideoHosting.Application.Services;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Enums;
using VideoHosting.Domain.Interfaces;
using Moq;
using Xunit;

namespace VideoHosting.Tests;

public class VideoServiceTests
{
    private readonly Mock<IVideoRepository> _videoRepository;
    private readonly Mock<IVideoReactionRepository> _videoReactionRepository;
    private readonly Mock<IUserRepository> _userRepository;
    private readonly Mock<IAdminActionLogRepository> _adminActionLogRepository;
    private readonly Mock<IMinioService> _minioService;
    private readonly Mock<IRabbitMqService> _rabbitMqService;
    private readonly Mock<ISubscriptionRepository> _subscriptionRepository;
    private readonly Mock<IVideoViewRepository> _videoViewRepository;
    private readonly VideoService _service;

    public VideoServiceTests()
    {
        _videoRepository = new Mock<IVideoRepository>();
        _videoReactionRepository = new Mock<IVideoReactionRepository>();
        _userRepository = new Mock<IUserRepository>();
        _adminActionLogRepository = new Mock<IAdminActionLogRepository>();
        _minioService = new Mock<IMinioService>();
        _rabbitMqService = new Mock<IRabbitMqService>();
        _subscriptionRepository = new Mock<ISubscriptionRepository>();
        _videoViewRepository = new Mock<IVideoViewRepository>();
        _service = new VideoService(
            _videoRepository.Object,
            _videoReactionRepository.Object,
            _userRepository.Object,
            _adminActionLogRepository.Object,
            _minioService.Object,
            _rabbitMqService.Object,
            _subscriptionRepository.Object,
            _videoViewRepository.Object);
    }

    private Video CreateVideo(Guid? id = null)
    {
        return new Video
        {
            Id = id ?? Guid.NewGuid(),
            Title = "Test Video",
            Description = "Test Description",
            UserId = Guid.NewGuid(),
            Status = "Ready",
            ModerationStatus = ModerationStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Views = 100,
            Likes = 10,
            Dislikes = 2
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

    [Fact]
    public async Task GetVideoByIdAsync_ReturnsVideoWhenExists()
    {
        // Arrange
        var video = CreateVideo();
        var user = CreateUser();
        _videoRepository.Setup(x => x.GetByIdAsync(video.Id)).ReturnsAsync(video);
        _userRepository.Setup(x => x.GetByIdAsync(video.UserId)).ReturnsAsync(user);
        _subscriptionRepository.Setup(x => x.GetSubscriberCountAsync(user.Id)).ReturnsAsync(5);

        // Act
        var result = await _service.GetVideoByIdAsync(video.Id);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(video.Id, result.Id);
        Assert.Equal(video.Title, result.Title);
        Assert.Equal("Approved", result.ModerationStatus);
    }

    [Fact]
    public async Task GetVideoByIdAsync_ReturnsNullWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _videoRepository.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Video?)null);

        // Act
        var result = await _service.GetVideoByIdAsync(id);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetAllVideosAsync_ReturnsAllVideos()
    {
        // Arrange
        var videos = new List<Video> { CreateVideo(), CreateVideo() };
        var user = CreateUser();
        _videoRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(videos);
        _userRepository.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(user);

        // Act
        var result = await _service.GetAllVideosAsync();

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task GetVideosByUserIdAsync_ReturnsUserVideos()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videos = new List<Video> { CreateVideo(), CreateVideo() };
        var user = CreateUser();
        _videoRepository.Setup(x => x.GetByUserIdAsync(userId)).ReturnsAsync(videos);
        _userRepository.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(user);

        // Act
        var result = await _service.GetVideosByUserIdAsync(userId);

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task UpdateVideoAsync_UpdatesVideo()
    {
        // Arrange
        var video = CreateVideo();
        var videoDto = new VideoDto
        {
            Id = video.Id,
            Title = "Updated Title",
            Description = "Updated Description",
            Status = "Ready"
        };
        _videoRepository.Setup(x => x.GetByIdAsync(video.Id)).ReturnsAsync(video);

        // Act
        await _service.UpdateVideoAsync(videoDto);

        // Assert
        _videoRepository.Verify(x => x.UpdateAsync(It.IsAny<Video>()), Times.Once);
    }

    [Fact]
    public async Task UpdateVideoAsync_ThrowsWhenNotFound()
    {
        // Arrange
        var videoDto = new VideoDto { Id = Guid.NewGuid(), Title = "Test" };
        _videoRepository.Setup(x => x.GetByIdAsync(videoDto.Id)).ReturnsAsync((Video?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.UpdateVideoAsync(videoDto));
    }

    [Fact]
    public async Task DeleteVideoAsync_DeletesVideo()
    {
        // Arrange
        var video = CreateVideo();
        video.OriginalVideoUrl = "videos/test.mp4";
        video.ThumbnailUrl = "thumbnails/test.jpg";
        _videoRepository.Setup(x => x.GetByIdAsync(video.Id)).ReturnsAsync(video);

        // Act
        await _service.DeleteVideoAsync(video.Id);

        // Assert
        _videoRepository.Verify(x => x.DeleteAsync(video.Id), Times.Once);
        _minioService.Verify(x => x.DeleteVideoAsync(video.OriginalVideoUrl), Times.Once);
        _minioService.Verify(x => x.DeleteThumbnailAsync(video.ThumbnailUrl), Times.Once);
    }

    [Fact]
    public async Task DeleteVideoAsync_ThrowsWhenNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _videoRepository.Setup(x => x.GetByIdAsync(id)).ReturnsAsync((Video?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.DeleteVideoAsync(id));
    }

    [Fact]
    public async Task AddOrUpdateReactionAsync_LikeAddsReaction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videoId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        _videoReactionRepository.Setup(x => x.GetByUserAndVideoAsync(userId, videoId))
            .ReturnsAsync((VideoReaction?)null);
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        await _service.AddOrUpdateReactionAsync(userId, videoId, "Like");

        // Assert
        _videoReactionRepository.Verify(x => x.CreateAsync(It.IsAny<VideoReaction>()), Times.Once);
        Assert.Equal(11, video.Likes); // Increased from 10
    }

    [Fact]
    public async Task AddOrUpdateReactionAsync_ChangesDislikeToLike()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videoId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        video.Likes = 10;
        video.Dislikes = 5;
        var existingReaction = new VideoReaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            VideoId = videoId,
            ReactionType = ReactionType.Dislike
        };
        _videoReactionRepository.Setup(x => x.GetByUserAndVideoAsync(userId, videoId))
            .ReturnsAsync(existingReaction);
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        await _service.AddOrUpdateReactionAsync(userId, videoId, "Like");

        // Assert
        _videoReactionRepository.Verify(x => x.UpdateAsync(existingReaction), Times.Once);
        Assert.Equal(11, video.Likes);  // +1
        Assert.Equal(4, video.Dislikes); // -1
    }

    [Fact]
    public async Task AddOrUpdateReactionAsync_SameReactionDoesNothing()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videoId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        var existingReaction = new VideoReaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            VideoId = videoId,
            ReactionType = ReactionType.Like
        };
        _videoReactionRepository.Setup(x => x.GetByUserAndVideoAsync(userId, videoId))
            .ReturnsAsync(existingReaction);
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        await _service.AddOrUpdateReactionAsync(userId, videoId, "Like");

        // Assert
        _videoReactionRepository.Verify(x => x.UpdateAsync(It.IsAny<VideoReaction>()), Times.Never);
        _videoRepository.Verify(x => x.UpdateAsync(It.IsAny<Video>()), Times.Never);
    }

    [Fact]
    public async Task AddOrUpdateReactionAsync_ThrowsOnInvalidReactionType()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videoId = Guid.NewGuid();

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddOrUpdateReactionAsync(userId, videoId, "InvalidType"));
    }

    [Fact]
    public async Task RemoveReactionAsync_RemovesReaction()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videoId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        video.Likes = 10;
        var reaction = new VideoReaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            VideoId = videoId,
            ReactionType = ReactionType.Like
        };
        _videoReactionRepository.Setup(x => x.GetByUserAndVideoAsync(userId, videoId))
            .ReturnsAsync(reaction);
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        await _service.RemoveReactionAsync(userId, videoId);

        // Assert
        _videoReactionRepository.Verify(x => x.DeleteAsync(reaction.Id), Times.Once);
        Assert.Equal(9, video.Likes); // Decreased by 1
    }

    [Fact]
    public async Task RemoveReactionAsync_NoReactionDoesNothing()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var videoId = Guid.NewGuid();
        _videoReactionRepository.Setup(x => x.GetByUserAndVideoAsync(userId, videoId))
            .ReturnsAsync((VideoReaction?)null);

        // Act
        await _service.RemoveReactionAsync(userId, videoId);

        // Assert
        _videoReactionRepository.Verify(x => x.DeleteAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task GetPopularVideosAsync_ReturnsSortedByViews()
    {
        // Arrange
        var videos = new List<Video>
        {
            new Video { Id = Guid.NewGuid(), Title = "V1", Views = 50, CreatedAt = DateTime.UtcNow },
            new Video { Id = Guid.NewGuid(), Title = "V2", Views = 200, CreatedAt = DateTime.UtcNow },
            new Video { Id = Guid.NewGuid(), Title = "V3", Views = 100, CreatedAt = DateTime.UtcNow }
        };
        var user = CreateUser();
        _videoRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(videos);
        _userRepository.Setup(x => x.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync(user);

        // Act
        var result = await _service.GetPopularVideosAsync(7);

        // Assert
        var resultList = result.ToList();
        Assert.Equal(3, resultList.Count);
        Assert.Equal("V2", resultList[0].Title); // Highest views first
        Assert.Equal("V3", resultList[1].Title);
        Assert.Equal("V1", resultList[2].Title);
    }

    [Fact]
    public async Task IncrementViewCountAsync_IncrementsViewsAndCreatesViewRecord()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        video.Views = 10;
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        await _service.IncrementViewCountAsync(videoId, userId, "127.0.0.1");

        // Assert
        Assert.Equal(11, video.Views);
        _videoRepository.Verify(x => x.UpdateAsync(video), Times.Once);
        _videoViewRepository.Verify(x => x.CreateAsync(It.IsAny<VideoView>()), Times.Once);
    }

    [Fact]
    public async Task IncrementViewCountAsync_ThrowsWhenVideoNotFound()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync((Video?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.IncrementViewCountAsync(videoId, null, "127.0.0.1"));
    }

    [Fact]
    public async Task SearchVideosAsync_ReturnsMatchingTitles()
    {
        // Arrange
        var videos = new List<Video>
        {
            new Video { Id = Guid.NewGuid(), Title = "C# Tutorial", CreatedAt = DateTime.UtcNow },
            new Video { Id = Guid.NewGuid(), Title = "Python Basics", CreatedAt = DateTime.UtcNow },
            new Video { Id = Guid.NewGuid(), Title = "C++ Advanced", CreatedAt = DateTime.UtcNow }
        };
        _videoRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(videos);

        // Act
        var result = _service.SearchVideosAsync("C#", 5).Result;

        // Assert
        var resultList = result.ToList();
        Assert.Single(resultList);
        Assert.Equal("C# Tutorial", resultList[0].Title);
    }

    [Fact]
    public async Task SearchVideosAsync_RespectsLimit()
    {
        // Arrange
        var videos = new List<Video>
        {
            new Video { Id = Guid.NewGuid(), Title = "Test A", CreatedAt = DateTime.UtcNow },
            new Video { Id = Guid.NewGuid(), Title = "Test B", CreatedAt = DateTime.UtcNow },
            new Video { Id = Guid.NewGuid(), Title = "Test C", CreatedAt = DateTime.UtcNow }
        };
        _videoRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(videos);

        // Act
        var result = await _service.SearchVideosAsync("Test", 2);

        // Assert
        Assert.Equal(2, result.Count());
    }

    [Fact]
    public async Task SearchVideosAsync_CaseInsensitive()
    {
        // Arrange
        var videos = new List<Video>
        {
            new Video { Id = Guid.NewGuid(), Title = "Hello World", CreatedAt = DateTime.UtcNow }
        };
        _videoRepository.Setup(x => x.GetAllAsync()).ReturnsAsync(videos);

        // Act
        var result = await _service.SearchVideosAsync("hello", 5);

        // Assert
        Assert.Single(result);
    }

    [Fact]
    public async Task GetVideoProcessingStatusAsync_ReadyReturns100Progress()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        video.Status = "ready";
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        var result = await _service.GetVideoProcessingStatusAsync(videoId);

        // Assert
        Assert.Equal(100, result.Progress);
        Assert.Equal(4, result.Resolutions.Count);
    }

    [Fact]
    public async Task GetVideoProcessingStatusAsync_FailedReturnsErrorMessage()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        var video = CreateVideo(videoId);
        video.Status = "failed";
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync(video);

        // Act
        var result = await _service.GetVideoProcessingStatusAsync(videoId);

        // Assert
        Assert.NotNull(result.ErrorMessage);
    }

    [Fact]
    public async Task GetVideoProcessingStatusAsync_ThrowsWhenVideoNotFound()
    {
        // Arrange
        var videoId = Guid.NewGuid();
        _videoRepository.Setup(x => x.GetByIdAsync(videoId)).ReturnsAsync((Video?)null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.GetVideoProcessingStatusAsync(videoId));
    }
}
