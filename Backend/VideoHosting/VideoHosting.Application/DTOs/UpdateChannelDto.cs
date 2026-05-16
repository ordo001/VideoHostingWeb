using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class UpdateChannelDto
{
    [Required]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Название канала должно содержать от 3 до 50 символов")]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(500, ErrorMessage = "Описание канала не должно превышать 500 символов")]
    public string? Description { get; set; }
    
    public string? AvatarUrl { get; set; }
    public string? BannerUrl { get; set; }
}