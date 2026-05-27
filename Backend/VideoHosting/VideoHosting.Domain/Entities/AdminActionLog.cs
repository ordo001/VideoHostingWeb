namespace VideoHosting.Domain.Entities;

public class AdminActionLog
{
    public Guid Id { get; set; }
    public Guid AdminUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid? TargetId { get; set; }
    public string? Reason { get; set; } = string.Empty;
    public string? Details { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public User AdminUser { get; set; } = null!;
}