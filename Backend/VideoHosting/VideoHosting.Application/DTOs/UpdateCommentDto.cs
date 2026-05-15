using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class UpdateCommentDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1, ErrorMessage = "Текст комментария должен содержать от 1 до 1000 символов")]
    public string Text { get; set; } = string.Empty;
}