using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class BanUserRequestDto
{
    [Required]
    [StringLength(500)]
    public string Reason { get; set; } = string.Empty;
    
    public DateTime? BannedUntil { get; set; }
}