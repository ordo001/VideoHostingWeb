namespace VideoHosting.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public Guid VideoId { get; set; }
    public Video Video { get; set; } = null!;
    
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}