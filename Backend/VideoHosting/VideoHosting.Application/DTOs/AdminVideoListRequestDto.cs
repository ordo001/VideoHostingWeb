using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class AdminVideoListRequestDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public string? ModerationStatus { get; set; } = "All";
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
}