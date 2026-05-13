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
[Authorize]
public class AdminController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IVideoService _videoService;

    public AdminController(IUserService userService, IVideoService videoService)
    {
        _userService = userService;
        _videoService = videoService;
    }

    /// <summary>
    /// Получение списка пользователей (только для администраторов)
    /// </summary>
    /// <param name="request">Параметры запроса списка пользователей</param>
    /// <returns>Список пользователей</returns>
    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers([FromQuery] AdminUserListRequestDto request)
    {
        try
        {
            IEnumerable<UserDto> users;
            
            // Получение пользователей с поиском
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                users = await _userService.SearchUsersAsync(request.SearchTerm);
            }
            else
            {
                users = await _userService.GetAllUsersAsync();
            }
            
            // Применение пагинации
            var paginatedUsers = users
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize);
            
            return Ok(paginatedUsers);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Удаление видео пользователем (только для администраторов)
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <param name="request">Причина удаления</param>
    /// <returns>Результат удаления</returns>
    [HttpDelete("videos/{videoId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<bool>> DeleteVideo(Guid videoId, [FromBody] AdminDeleteVideoRequestDto request)
    {
        try
        {
            var video = await _videoService.GetVideoByIdAsync(videoId);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            // Получение ID администратора из токена
            var adminUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(adminUserId) || !Guid.TryParse(adminUserId, out var adminGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            await _videoService.DeleteVideoByAdminAsync(videoId, adminGuid, request.Reason);
            
            return Ok(true);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
}