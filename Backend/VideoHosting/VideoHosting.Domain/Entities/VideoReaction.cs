namespace VideoHosting.Domain.Entities;

public class VideoReaction
{
    public Guid Id { get; set; }
    public string ReactionType { get; set; } = string.Empty; // Like, Dislike
    public DateTime CreatedAt { get; set; }
    
    // Foreign keys
    public Guid UserId { get; set; }
    public Guid VideoId { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public Video Video { get; set; } = null!;
}