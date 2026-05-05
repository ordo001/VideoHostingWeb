using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Api.Middleware;

namespace VideoHosting.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
        /// Регистрация нового пользователя
        /// </summary>
        /// <param name="request">Данные для регистрации</param>
        /// <returns>Токен доступа и информация о пользователе</returns>
        [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterRequestDto request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Пользователь успешно зарегистрирован"));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<AuthResponseDto>.Error(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<AuthResponseDto>.Error("Произошла внутренняя ошибка сервера", new List<string> { ex.Message }));
        }
    }

    /// <summary>
    /// Авторизация пользователя
    /// </summary>
    /// <param name="request">Данные для авторизации</param>
    /// <returns>Токен доступа и информация о пользователе</returns>
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginRequestDto request)
    {
        try
        {
            var result = await _authService.LoginAsync(request);
            return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Пользователь успешно авторизован"));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ApiResponse<AuthResponseDto>.Error(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<AuthResponseDto>.Error("Произошла внутренняя ошибка сервера", new List<string> { ex.Message }));
        }
    }

    /// <summary>
    /// Получение информации о текущем пользователе
    /// </summary>
    /// <returns>Информация о текущем пользователе</returns>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetCurrentUser()
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(ApiResponse<UserDto>.Error("Неверный токен доступа"));
            }

            var user = await _authService.GetCurrentUserAsync(userGuid);
            return Ok(ApiResponse<UserDto>.Ok(user, "Информация о пользователе получена"));
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ApiResponse<UserDto>.Error(ex.Message));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<UserDto>.Error("Произошла внутренняя ошибка сервера", new List<string> { ex.Message }));
        }
    }
}