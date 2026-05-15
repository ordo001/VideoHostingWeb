using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Api.Models;

public class VideoUploadModel
{
    [Required(ErrorMessage = "Заголовок видео обязателен")]
    [StringLength(255, ErrorMessage = "Заголовок должен быть длиной до 255 символов")]
    [FromForm(Name = "title")]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000, ErrorMessage = "Описание должно быть длиной до 1000 символов")]
    [FromForm(Name = "description")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Файл видео обязателен")]
    [FromForm(Name = "video_file")]
    public IFormFile VideoFile { get; set; } = null!;

    [FromForm(Name = "thumbnail_file")]
    public IFormFile? ThumbnailFile { get; set; }
}