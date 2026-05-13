namespace VideoHosting.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Description { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public ICollection<Video> Videos { get; set; } = new List<Video>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    public ICollection<Subscription> Subscribers { get; set; } = new List<Subscription>();
    public ICollection<VideoReaction> VideoReactions { get; set; } = new List<VideoReaction>();
}