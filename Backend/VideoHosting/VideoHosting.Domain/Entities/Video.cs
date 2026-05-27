using VideoHosting.Domain.Enums;

namespace VideoHosting.Domain.Entities;

public class Video
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? OriginalVideoUrl { get; set; }
    public string? HlsUrl { get; set; }
    public int? Duration { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public int Dislikes { get; set; }
    public string Status { get; set; } = "Processing";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Moderation fields
    public bool IsModerated { get; set; }
    public ModerationStatus ModerationStatus { get; set; } = ModerationStatus.Pending;
    public DateTime? ModerationDate { get; set; }
    public Guid? ModeratedById { get; set; }
    
    // Foreign key
    public Guid UserId { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public User? ModeratedBy { get; set; }
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<VideoReaction> VideoReactions { get; set; } = new List<VideoReaction>();
    public ICollection<VideoView> VideoViews { get; set; } = new List<VideoView>();
}