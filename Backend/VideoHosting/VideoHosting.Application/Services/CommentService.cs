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

    public CommentService(
        ICommentRepository commentRepository,
        IUserRepository userRepository,
        IVideoRepository videoRepository)
    {
        _commentRepository = commentRepository;
        _userRepository = userRepository;
        _videoRepository = videoRepository;
    }

    public async Task<CommentDto?> GetCommentByIdAsync(Guid id)
    {
        var comment = await _commentRepository.GetByIdAsync(id);
        if (comment == null)
            return null;

        var user = await _userRepository.GetByIdAsync(comment.UserId);
        return MapToDto(comment, user);
    }

    public async Task<IEnumerable<CommentDto>> GetCommentsByVideoIdAsync(Guid videoId, int limit = 20, int offset = 0)
    {
        var comments = await _commentRepository.GetByVideoIdAsync(videoId, limit, offset);
        var commentDtos = new List<CommentDto>();
        
        foreach (var comment in comments)
        {
            var user = await _userRepository.GetByIdAsync(comment.UserId);
            commentDtos.Add(MapToDto(comment, user));
        }
        
        // Сортируем по дате создания (новые первые)
        return commentDtos.OrderByDescending(c => c.CreatedAt);
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
        return MapToDto(createdComment, user);
    }

    public async Task<bool> UpdateCommentAsync(Guid commentId, Guid userId, CreateCommentDto updateDto)
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

    private CommentDto MapToDto(Comment comment, User? user)
    {
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
                SubscribersCount = 0 // Зададим значение по умолчанию, можно доработать позже
            } : null!
        };
    }
}