using VideoHosting.Application.DTOs;

namespace VideoHosting.Application.Interfaces;

public interface ICommentService
{
    Task<CommentDto?> GetCommentByIdAsync(Guid id);
    Task<IEnumerable<CommentDto>> GetCommentsByVideoIdAsync(Guid videoId, int limit = 20, int offset = 0);
    Task<CommentDto> CreateCommentAsync(Guid videoId, Guid userId, CreateCommentDto createDto);
    Task<bool> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentDto updateDto);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId);
    Task<int> GetCommentCountByVideoIdAsync(Guid videoId);
}