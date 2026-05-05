using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Api.Models;

public class VideoUploadDto
{
    [Required(ErrorMessage = "Заголовок видео обязателен")]
    [StringLength(255, ErrorMessage = "Заголовок должен быть длиной до 255 символов")]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Описание должно быть длиной до 1000 символов")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Файл видео обязателен")]
    public IFormFile VideoFile { get; set; } = null!;

    public IFormFile? ThumbnailFile { get; set; }
}