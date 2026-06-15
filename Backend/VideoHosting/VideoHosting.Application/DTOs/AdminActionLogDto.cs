namespace VideoHosting.Application.DTOs;

public class AdminActionLogDto
{
    public Guid Id { get; set; }
    public Guid AdminId { get; set; }
    public string AdminName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid? TargetId { get; set; }
    public string? Reason { get; set; }
    public string? Details { get; set; }
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string? AdminAvatarUrl { get; set; }
}