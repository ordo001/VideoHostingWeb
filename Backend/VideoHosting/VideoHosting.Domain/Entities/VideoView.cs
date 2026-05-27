namespace VideoHosting.Domain.Entities;

public class VideoView
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid VideoId { get; set; }
    public Guid? UserId { get; set; }
    public DateTime ViewedAt { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    
    // Navigation properties
    public Video Video { get; set; } = null!;
    public User? User { get; set; }
}