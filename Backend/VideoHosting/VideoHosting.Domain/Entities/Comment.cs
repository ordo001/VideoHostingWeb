namespace VideoHosting.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Likes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Foreign keys
    public Guid UserId { get; set; }
    public Guid VideoId { get; set; }
    
    // Navigation properties
    public User User { get; set; } = null!;
    public Video Video { get; set; } = null!;
}