using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;

namespace VideoHosting.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IVideoService _videoService;

    public AdminController(IAdminService adminService, IVideoService videoService)
    {
        _adminService = adminService;
        _videoService = videoService;
    }

    /// <summary>
    /// Получение списка пользователей (только для администраторов)
    /// </summary>
    /// <param name="request">Параметры запроса списка пользователей</param>
    /// <returns>Список пользователей</returns>
    [HttpGet("users")]
    public async Task<ActionResult<ApiResponseDto<PaginatedResponseDto<AdminUserDto>>>> GetUsers([FromQuery] AdminUserListRequestDto request)
    {
        try
        {
            var result = await _adminService.GetUsersAsync(request);
            
            return Ok(new ApiResponseDto<PaginatedResponseDto<AdminUserDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<PaginatedResponseDto<AdminUserDto>>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Блокировка пользователя
    /// </summary>
    /// <param name="userId">ID пользователя</param>
    /// <param name="request">Параметры блокировки</param>
    /// <returns>Результат операции</returns>
    [HttpPost("users/{userId}/ban")]
    public async Task<ActionResult<ApiResponseDto<object>>> BanUser(Guid userId, [FromBody] BanUserRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            var result = await _adminService.BanUserAsync(userId, adminId, request, ipAddress, userAgent);
            
            if (!result)
            {
                return NotFound(new ApiResponseDto<object>
                {
                    Success = false,
                    Error = "Пользователь не найден"
                });
            }

            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Пользователь успешно заблокирован"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Разблокировка пользователя
    /// </summary>
    /// <param name="userId">ID пользователя</param>
    /// <param name="request">Параметры разблокировки</param>
    /// <returns>Результат операции</returns>
    [HttpPost("users/{userId}/unban")]
    public async Task<ActionResult<ApiResponseDto<object>>> UnbanUser(Guid userId, [FromBody] UnbanUserRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            var result = await _adminService.UnbanUserAsync(userId, adminId, request, ipAddress, userAgent);
            
            if (!result)
            {
                return NotFound(new ApiResponseDto<object>
                {
                    Success = false,
                    Error = "Пользователь не найден"
                });
            }

            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Пользователь успешно разблокирован"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Назначение прав администратора
    /// </summary>
    /// <param name="userId">ID пользователя</param>
    /// <param name="request">Параметры назначения</param>
    /// <returns>Результат операции</returns>
    [HttpPost("users/{userId}/make-admin")]
    public async Task<ActionResult<ApiResponseDto<object>>> MakeUserAdmin(Guid userId, [FromBody] AdminActionRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            var result = await _adminService.MakeUserAdminAsync(userId, adminId, request, ipAddress, userAgent);
            
            if (!result)
            {
                return NotFound(new ApiResponseDto<object>
                {
                    Success = false,
                    Error = "Пользователь не найден"
                });
            }

            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Права администратора успешно назначены"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Отзыв прав администратора
    /// </summary>
    /// <param name="userId">ID пользователя</param>
    /// <param name="request">Параметры отзыва прав</param>
    /// <returns>Результат операции</returns>
    [HttpPost("users/{userId}/revoke-admin")]
    public async Task<ActionResult<ApiResponseDto<object>>> RevokeUserAdmin(Guid userId, [FromBody] AdminActionRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            var result = await _adminService.RevokeUserAdminAsync(userId, adminId, request, ipAddress, userAgent);
            
            if (!result)
            {
                return NotFound(new ApiResponseDto<object>
                {
                    Success = false,
                    Error = "Пользователь не найден"
                });
            }

            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Права администратора успешно отозваны"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Получение списка видео для модерации
    /// </summary>
    /// <param name="request">Параметры запроса списка видео</param>
    /// <returns>Список видео</returns>
    [HttpGet("videos")]
    public async Task<ActionResult<ApiResponseDto<PaginatedResponseDto<AdminVideoDto>>>> GetVideos([FromQuery] AdminVideoListRequestDto request)
    {
        try
        {
            var result = await _adminService.GetVideosAsync(request);
            
            return Ok(new ApiResponseDto<PaginatedResponseDto<AdminVideoDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<PaginatedResponseDto<AdminVideoDto>>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Удаление видео администратором
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <param name="request">Причина удаления</param>
    /// <returns>Результат удаления</returns>
    [HttpDelete("videos/{videoId}")]
    public async Task<ActionResult<ApiResponseDto<object>>> DeleteVideo(Guid videoId, [FromBody] AdminDeleteVideoRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            // Логирование действия
            await _adminService.LogAdminActionAsync(
                adminId, 
                "DeleteVideo", 
                "Video", 
                videoId, 
                request.Reason, 
                null,
                ipAddress, 
                userAgent);

            // Фактическое удаление видео
            await _videoService.DeleteVideoByAdminAsync(videoId, adminId, request.Reason);
            
            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Видео успешно удалено"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Одобрение видео
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <param name="request">Параметры одобрения</param>
    /// <returns>Результат операции</returns>
    [HttpPost("videos/{videoId}/approve")]
    public async Task<ActionResult<ApiResponseDto<object>>> ApproveVideo(Guid videoId, [FromBody] ApproveVideoRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            var result = await _adminService.ApproveVideoAsync(videoId, adminId, request, ipAddress, userAgent);
            
            if (!result)
            {
                return NotFound(new ApiResponseDto<object>
                {
                    Success = false,
                    Error = "Видео не найдено"
                });
            }

            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Видео успешно одобрено"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Отклонение видео
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <param name="request">Параметры отклонения</param>
    /// <returns>Результат операции</returns>
    [HttpPost("videos/{videoId}/reject")]
    public async Task<ActionResult<ApiResponseDto<object>>> RejectVideo(Guid videoId, [FromBody] RejectVideoRequestDto request)
    {
        try
        {
            var adminId = GetAdminId();
            var ipAddress = GetUserIpAddress();
            var userAgent = GetUserAgent();

            var result = await _adminService.RejectVideoAsync(videoId, adminId, request, ipAddress, userAgent);
            
            if (!result)
            {
                return NotFound(new ApiResponseDto<object>
                {
                    Success = false,
                    Error = "Видео не найдено"
                });
            }

            return Ok(new ApiResponseDto<object>
            {
                Success = true,
                Message = "Видео успешно отклонено"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<object>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Получение статистики платформы
    /// </summary>
    /// <param name="period">Период для статистики (24h, 7d, 30d, all)</param>
    /// <returns>Данные статистики</returns>
    [HttpGet("stats")]
    public async Task<ActionResult<ApiResponseDto<PlatformStatsDto>>> GetStats([FromQuery] string period = "30d")
    {
        try
        {
            var result = await _adminService.GetPlatformStatsAsync(period);
            
            return Ok(new ApiResponseDto<PlatformStatsDto>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<PlatformStatsDto>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    /// <summary>
    /// Получение логов действий администраторов
    /// </summary>
    /// <param name="request">Параметры запроса логов</param>
    /// <returns>Логи действий</returns>
    [HttpGet("logs")]
    public async Task<ActionResult<ApiResponseDto<PaginatedResponseDto<AdminActionLogDto>>>> GetLogs([FromQuery] AdminLogsRequestDto request)
    {
        try
        {
            var result = await _adminService.GetLogsAsync(request);
            
            return Ok(new ApiResponseDto<PaginatedResponseDto<AdminActionLogDto>>
            {
                Success = true,
                Data = result
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponseDto<PaginatedResponseDto<AdminActionLogDto>>
            {
                Success = false,
                Error = "Произошла внутренняя ошибка сервера"
            });
        }
    }

    #region Helper Methods

    private Guid GetAdminId()
    {
        var adminIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(adminIdStr) || !Guid.TryParse(adminIdStr, out var adminId))
        {
            throw new UnauthorizedAccessException("Неверный токен доступа");
        }
        return adminId;
    }

    private string GetUserIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }

    private string GetUserAgent()
    {
        return Request.Headers["User-Agent"].ToString();
    }

    #endregion
}