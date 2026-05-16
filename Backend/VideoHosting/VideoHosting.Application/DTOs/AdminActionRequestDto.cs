using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class AdminActionRequestDto
{
    [StringLength(500)]
    public string? Reason { get; set; }
}