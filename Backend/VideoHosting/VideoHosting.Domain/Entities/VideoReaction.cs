using VideoHosting.Domain.Enums;

namespace VideoHosting.Domain.Entities;

public class VideoReaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ReactionType ReactionType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Foreign keys
    public Guid UserId { get; set; }
    public Guid VideoId { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public Video Video { get; set; } = null!;
}