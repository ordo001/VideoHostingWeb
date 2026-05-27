using VideoHosting.Domain.Enums;

namespace VideoHosting.Application.DTOs;

public class AdminVideoDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public int? Duration { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public int Dislikes { get; set; }
    public DateTime UploadDate { get; set; }
    public ModerationStatus ModerationStatus { get; set; }
    public DateTime? ModerationDate { get; set; }
    public string? ModeratedBy { get; set; }
}