using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace VideoHosting.Application.DTOs;

public class FileUploadDto
{
    [Required(ErrorMessage = "Файл обязателен")]
    public IFormFile File { get; set; } = null!;
}

public class AvatarUploadDto
{
    [Required(ErrorMessage = "Файл аватара обязателен")]
    [AllowedExtensions(new string[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" })]
    [MaxFileSize(5 * 1024 * 1024)] // 5MB
    public IFormFile Avatar { get; set; } = null!;
}

public class BannerUploadDto
{
    [Required(ErrorMessage = "Файл баннера обязателен")]
    [AllowedExtensions(new string[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" })]
    [MaxFileSize(10 * 1024 * 1024)] // 10MB
    public IFormFile Banner { get; set; } = null!;
}

public class FileUploadResponseDto
{
    public string Url { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}