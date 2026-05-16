namespace VideoHosting.Application.DTOs;

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool IsBanned { get; set; }
    public DateTime? BannedUntil { get; set; }
    public string? BanReason { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime RegistrationDate { get; set; }
    public DateTime? LastLoginDate { get; set; }
    public int VideoCount { get; set; }
    public int TotalViews { get; set; }
}