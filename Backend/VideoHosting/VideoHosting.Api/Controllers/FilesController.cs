using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Services;

namespace VideoHosting.Api.Controllers;

/// <summary>
/// Контроллер для загрузки файлов (аватары, баннеры)
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private readonly IFileService _fileService;
    private readonly ILogger<FilesController> _logger;

    public FilesController(IFileService fileService, ILogger<FilesController> logger)
    {
        _fileService = fileService;
        _logger = logger;
    }

    /// <summary>
    /// Загрузка аватара пользователя
    /// </summary>
    /// <param name="avatarFile">Файл аватара</param>
    /// <returns>URL загруженного аватара</returns>
    [HttpPost("avatar")]
    [Authorize]
    public async Task<ActionResult<FileUploadResponseDto>> UploadAvatar(IFormFile avatarFile)
    {
        try
        {
            // Получение ID пользователя из токена
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            if (avatarFile == null || avatarFile.Length == 0)
            {
                return BadRequest(new { error = new { message = "Файл не выбран" } });
            }

            var result = await _fileService.UploadAvatarAsync(avatarFile, userId);
            
            if (string.IsNullOrEmpty(result.Url))
            {
                return BadRequest(new { error = new { message = result.Message } });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке аватара");
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Загрузка баннера канала
    /// </summary>
    /// <param name="bannerFile">Файл баннера</param>
    /// <returns>URL загруженного баннера</returns>
    [HttpPost("banner")]
    [Authorize]
    public async Task<ActionResult<FileUploadResponseDto>> UploadBanner(IFormFile bannerFile)
    {
        try
        {
            // Получение ID пользователя из токена
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            if (bannerFile == null || bannerFile.Length == 0)
            {
                return BadRequest(new { error = new { message = "Файл не выбран" } });
            }

            var result = await _fileService.UploadBannerAsync(bannerFile, userId);
            
            if (string.IsNullOrEmpty(result.Url))
            {
                return BadRequest(new { error = new { message = result.Message } });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке баннера");
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Загрузка аватара для конкретного пользователя (для администраторов)
    /// </summary>
    /// <param name="userId">ID пользователя</param>
    /// <param name="avatarFile">Файл аватара</param>
    /// <returns>URL загруженного аватара</returns>
    [HttpPost("{userId}/avatar")]
    [Authorize]
    public async Task<ActionResult<FileUploadResponseDto>> UploadAvatarForUser(Guid userId, IFormFile avatarFile)
    {
        try
        {
            // Получение ID текущего пользователя из токена
            var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserIdClaim) || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Проверка, что текущий пользователь является администратором или загружает аватар себе
            var currentUser = await _fileService.GetUserService().GetUserByIdAsync(currentUserId);
            if (currentUser == null || (!currentUser.IsAdmin && currentUserId != userId))
            {
                return Forbid();
            }

            if (avatarFile == null || avatarFile.Length == 0)
            {
                return BadRequest(new { error = new { message = "Файл не выбран" } });
            }

            var result = await _fileService.UploadAvatarAsync(avatarFile, userId);
            
            if (string.IsNullOrEmpty(result.Url))
            {
                return BadRequest(new { error = new { message = result.Message } });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке аватара для пользователя {UserId}", userId);
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Загрузка баннера для конкретного канала (для администраторов)
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <param name="bannerFile">Файл баннера</param>
    /// <returns>URL загруженного баннера</returns>
    [HttpPost("{channelId}/banner")]
    [Authorize]
    public async Task<ActionResult<FileUploadResponseDto>> UploadBannerForChannel(Guid channelId, IFormFile bannerFile)
    {
        try
        {
            // Получение ID текущего пользователя из токена
            var currentUserIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserIdClaim) || !Guid.TryParse(currentUserIdClaim, out var currentUserId))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Проверка, что текущий пользователь является администратором или владелец канала
            var currentUser = await _fileService.GetUserService().GetUserByIdAsync(currentUserId);
            if (currentUser == null || (!currentUser.IsAdmin && currentUserId != channelId))
            {
                return Forbid();
            }

            if (bannerFile == null || bannerFile.Length == 0)
            {
                return BadRequest(new { error = new { message = "Файл не выбран" } });
            }

            var result = await _fileService.UploadBannerAsync(bannerFile, channelId);
            
            if (string.IsNullOrEmpty(result.Url))
            {
                return BadRequest(new { error = new { message = result.Message } });
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при загрузке баннера для канала {ChannelId}", channelId);
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
}