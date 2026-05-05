using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Api.Middleware;

namespace VideoHosting.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Получение информации о текущем пользователе
    /// </summary>
    /// <returns>Информация о текущем пользователе</returns>
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetProfile()
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(ApiResponse<UserDto>.Error("Неверный токен доступа"));
            }

            var user = await _userService.GetUserByIdAsync(userGuid);
            if (user == null)
            {
                return NotFound(ApiResponse<UserDto>.Error("Пользователь не найден"));
            }

            return Ok(ApiResponse<UserDto>.Ok(user, "Информация о пользователе получена"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<UserDto>.Error("Произошла внутренняя ошибка сервера", new List<string> { ex.Message }));
        }
    }

    /// <summary>
    /// Обновление профиля пользователя
    /// </summary>
    /// <param name="userDto">Обновленные данные пользователя</param>
    /// <returns>Обновленная информация о пользователе</returns>
    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<UserDto>>> UpdateProfile([FromBody] UserDto userDto)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(ApiResponse<UserDto>.Error("Неверный токен доступа"));
            }

            // Проверка, что пользователь обновляет свой профиль
            if (userDto.Id != userGuid)
            {
                return Forbid("Нет прав для обновления профиля другого пользователя");
            }

            await _userService.UpdateUserAsync(userDto);
            return Ok(ApiResponse<UserDto>.Ok(userDto, "Профиль успешно обновлен"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<UserDto>.Error("Произошла внутренняя ошибка сервера", new List<string> { ex.Message }));
        }
    }
}