using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class AdminLogsRequestDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? AdminId { get; set; }
    public string? ActionType { get; set; } = "All";
    public string? Action { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
}