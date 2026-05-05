namespace VideoHosting.Domain.Entities;

public class Subscription
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Foreign keys
    public Guid SubscriberId { get; set; }
    public Guid ChannelId { get; set; }
    
    // Navigation properties
    public User Subscriber { get; set; } = null!;
    public User Channel { get; set; } = null!;
}