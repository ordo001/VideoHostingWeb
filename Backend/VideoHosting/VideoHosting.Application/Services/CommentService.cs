using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Application.Services;

public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IVideoRepository _videoRepository;
    private readonly ISubscriptionRepository _subscriptionRepository;

    public CommentService(
        ICommentRepository commentRepository,
        IUserRepository userRepository,
        IVideoRepository videoRepository,
        ISubscriptionRepository subscriptionRepository)
    {
        _commentRepository = commentRepository;
        _userRepository = userRepository;
        _videoRepository = videoRepository;
        _subscriptionRepository = subscriptionRepository;
    }

    public async Task<CommentDto?> GetCommentByIdAsync(Guid id)
    {
        var comment = await _commentRepository.GetByIdAsync(id);
        if (comment == null)
            return null;

        // The repository already includes the User, so we don't need to fetch it again
        var user = comment.User;
        return await MapToDtoAsync(comment, user);
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsByVideoIdAsync(Guid videoId, int limit = 20, int offset = 0)
    {
        var comments = await _commentRepository.GetByVideoIdAsync(videoId, limit, offset);
        var commentDtos = new List<CommentDto>();
        
        foreach (var comment in comments)
        {
            // The repository already includes the User, so we don't need to fetch it again
            var user = comment.User;
            commentDtos.Add(await MapToDtoAsync(comment, user));
        }
        
        // Comments are already sorted by CreatedAt in the repository
        return commentDtos;
    }

    public async Task<CommentDto> CreateCommentAsync(Guid videoId, Guid userId, CreateCommentDto createDto)
    {
        // Проверяем, существует ли видео
        var video = await _videoRepository.GetByIdAsync(videoId);
        if (video == null)
            throw new InvalidOperationException("Видео не найдено");
            
        // Проверяем, существует ли пользователь
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            throw new InvalidOperationException("Пользователь не найден");

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            Text = createDto.Text,
            VideoId = videoId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdComment = await _commentRepository.CreateAsync(comment);
        return await MapToDtoAsync(createdComment, user);
    }

    public async Task<bool> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentDto updateDto)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
            return false;
            
        // Проверяем, что комментарий принадлежит пользователю
        if (comment.UserId != userId)
            throw new UnauthorizedAccessException("Нет прав для редактирования этого комментария");

        comment.Text = updateDto.Text;
        comment.UpdatedAt = DateTime.UtcNow;
        
        await _commentRepository.UpdateAsync(comment);
        return true;
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _commentRepository.GetByIdAsync(commentId);
        if (comment == null)
            return false;
            
        // Проверяем, что комментарий принадлежит пользователю
        if (comment.UserId != userId)
            throw new UnauthorizedAccessException("Нет прав для удаления этого комментария");

        await _commentRepository.DeleteAsync(commentId);
        return true;
    }

    public async Task<int> GetCommentCountByVideoIdAsync(Guid videoId)
    {
        return await _commentRepository.GetCountByVideoIdAsync(videoId);
    }

    private async Task<CommentDto> MapToDtoAsync(Comment comment, User? user)
    {
        int subscribersCount = 0;
        if (user != null)
        {
            subscribersCount = await _subscriptionRepository.GetSubscriberCountAsync(user.Id);
        }
        
        return new CommentDto
        {
            Id = comment.Id,
            Text = comment.Text,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            VideoId = comment.VideoId,
            User = user != null ? new UserDto
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
            } : null!
        };
    }
}