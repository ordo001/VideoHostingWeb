using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using VideoHosting.Application.DTOs;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Application.Interfaces;

namespace VideoHosting.Application.Services;

public interface IFileService
{
    Task<FileUploadResponseDto> UploadAvatarAsync(IFormFile avatarFile, Guid userId);
    Task<FileUploadResponseDto> UploadBannerAsync(IFormFile bannerFile, Guid channelId);
    Task<bool> DeleteAvatarAsync(string avatarUrl);
    Task<bool> DeleteBannerAsync(string bannerUrl);
    IUserService GetUserService();
}

public class FileService : IFileService
{
    private readonly IMinioService _minioService;
    private readonly IUserService _userService;
    private readonly ILogger<FileService> _logger;

    public FileService(IMinioService minioService, IUserService userService, ILogger<FileService> logger)
    {
        _minioService = minioService;
        _userService = userService;
        _logger = logger;
    }

    public IUserService GetUserService()
    {
        return _userService;
    }

    public async Task<FileUploadResponseDto> UploadAvatarAsync(IFormFile avatarFile, Guid userId)
    {
        try
        {
            // Валидация файла
            var validationResult = ValidateImageFile(avatarFile, 5 * 1024 * 1024); // 5MB
            if (!validationResult.IsValid)
            {
                return new FileUploadResponseDto 
                { 
                    Url = string.Empty, 
                    Message = validationResult.ErrorMessage 
                };
            }

            // Получаем текущего пользователя
            var user = await _userService.GetUserByIdAsync(userId);
            if (user == null)
            {
                return new FileUploadResponseDto 
                { 
                    Url = string.Empty, 
                    Message = "Пользователь не найден" 
                };
            }

            // Удаляем старый аватар, если он есть
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                try
                {
                    await _minioService.DeleteAvatarAsync(user.AvatarUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Не удалось удалить старый аватар: {AvatarUrl}", user.AvatarUrl);
                }
            }

            // Генерируем уникальное имя файла
            var fileExtension = Path.GetExtension(avatarFile.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            
            // Загружаем новый аватар
            using var stream = avatarFile.OpenReadStream();
            var avatarUrl = await _minioService.UploadAvatarAsync(stream, fileName, avatarFile.ContentType);
            
            // Обновляем URL аватара в базе данных
            user.AvatarUrl = avatarUrl;
            await _userService.UpdateUserAsync(user);

            return new FileUploadResponseDto 
            { 
                Url = avatarUrl, 
                Message = "Аватар успешно загружен" 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке аватара для пользователя {UserId}", userId);
            return new FileUploadResponseDto 
            { 
                Url = string.Empty, 
                Message = "Произошла ошибка при загрузке аватара" 
            };
        }
    }

    public async Task<FileUploadResponseDto> UploadBannerAsync(IFormFile bannerFile, Guid channelId)
    {
        try
        {
            // Валидация файла
            var validationResult = ValidateImageFile(bannerFile, 10 * 1024 * 1024); // 10MB
            if (!validationResult.IsValid)
            {
                return new FileUploadResponseDto 
                { 
                    Url = string.Empty, 
                    Message = validationResult.ErrorMessage 
                };
            }

            // Получаем канал (пользователя)
            var channel = await _userService.GetUserByIdAsync(channelId);
            if (channel == null)
            {
                return new FileUploadResponseDto 
                { 
                    Url = string.Empty, 
                    Message = "Канал не найден" 
                };
            }

            // Удаляем старый баннер, если он есть
            if (!string.IsNullOrEmpty(channel.BannerUrl))
            {
                try
                {
                    await _minioService.DeleteBannerAsync(channel.BannerUrl);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Не удалось удалить старый баннер: {BannerUrl}", channel.BannerUrl);
                }
            }

            // Генерируем уникальное имя файла
            var fileExtension = Path.GetExtension(bannerFile.FileName);
            var fileName = $"{Guid.NewGuid()}{fileExtension}";
            
            // Загружаем новый баннер
            using var stream = bannerFile.OpenReadStream();
            var bannerUrl = await _minioService.UploadBannerAsync(stream, fileName, bannerFile.ContentType);
            
            // Обновляем URL баннера в базе данных
            channel.BannerUrl = bannerUrl;
            await _userService.UpdateUserAsync(channel);

            return new FileUploadResponseDto 
            { 
                Url = bannerUrl, 
                Message = "Баннер успешно загружен" 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке баннера для канала {ChannelId}", channelId);
            return new FileUploadResponseDto 
            { 
                Url = string.Empty, 
                Message = "Произошла ошибка при загрузке баннера" 
            };
        }
    }

    public async Task<bool> DeleteAvatarAsync(string avatarUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(avatarUrl))
                return true;

            await _minioService.DeleteAvatarAsync(avatarUrl);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при удалении аватара {AvatarUrl}", avatarUrl);
            return false;
        }
    }

    public async Task<bool> DeleteBannerAsync(string bannerUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(bannerUrl))
                return true;

            await _minioService.DeleteBannerAsync(bannerUrl);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при удалении баннера {BannerUrl}", bannerUrl);
            return false;
        }
    }

    private (bool IsValid, string ErrorMessage) ValidateImageFile(IFormFile file, int maxSizeBytes)
    {
        if (file == null || file.Length == 0)
        {
            return (false, "Файл не выбран");
        }

        // Проверка размера
        if (file.Length > maxSizeBytes)
        {
            var maxSizeMB = maxSizeBytes / (1024 * 1024);
            return (false, $"Размер файла превышает максимальный допустимый ({maxSizeMB}MB)");
        }

        // Проверка типа content-type
        var allowedContentTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
        if (!allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return (false, "Недопустимый формат файла. Разрешены: JPEG, PNG, GIF, WebP");
        }

        // Проверка расширения файла
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(fileExtension))
        {
            return (false, "Недопустимое расширение файла. Разрешены: .jpg, .jpeg, .png, .gif, .webp");
        }

        return (true, string.Empty);
    }
}