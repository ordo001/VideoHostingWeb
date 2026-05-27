namespace VideoHosting.Application.DTOs;

public class AdminUserListRequestDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public bool? IsBanned { get; set; }
    public bool? IsAdmin { get; set; }
}