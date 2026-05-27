using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class UnbanUserRequestDto
{
    [StringLength(500)]
    public string? Reason { get; set; }
}