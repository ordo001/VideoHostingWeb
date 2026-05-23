namespace VideoHosting.Domain.Entities;

public class ViewHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime ViewedAt { get; set; }
    
    public Guid UserId { get; set; }
    public Guid VideoId { get; set; }
    
    public User User { get; set; } = null!;
    public Video Video { get; set; } = null!;
}