namespace VideoHosting.Application.DTOs;

public class VideoReactionDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid VideoId { get; set; }
    public string ReactionType { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}