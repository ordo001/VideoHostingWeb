using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class RejectVideoRequestDto
{
    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = string.Empty;
}