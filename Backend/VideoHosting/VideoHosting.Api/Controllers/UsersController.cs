using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;

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
    
    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out userId);
    }

    /// <summary>
    /// Получение информации о текущем пользователе
    /// </summary>
    /// <returns>Информация о текущем пользователе</returns>
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var user = await _userService.GetUserByIdAsync(userGuid);
            if (user == null)
            {
                return NotFound(new { error = new { message = "Пользователь не найден" } });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Обновление профиля пользователя
    /// </summary>
    /// <param name="userDto">Обновленные данные пользователя</param>
    /// <returns>Обновленная информация о пользователе</returns>
    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UserDto userDto)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Проверка, что пользователь обновляет свой профиль
            if (userDto.Id != userGuid)
            {
                return Forbid("Нет прав для обновления профиля другого пользователя");
            }

            await _userService.UpdateUserAsync(userDto);
            return Ok(userDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Подписка на канал
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Результат подписки</returns>
    [HttpPost("{channelId}/subscribe")]
    [Authorize]
    public async Task<ActionResult<bool>> Subscribe(Guid channelId)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Проверка, что пользователь не пытается подписаться на самого себя
            if (userGuid == channelId)
            {
                return BadRequest(new { error = new { message = "Нельзя подписаться на самого себя" } });
            }

            var result = await _userService.SubscribeAsync(userGuid, channelId);
            
            if (!result)
            {
                return BadRequest(new { error = new { message = "Подписка уже существует или пользователь не найден" } });
            }

            return Ok(true);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Отписка от канала
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Результат отписки</returns>
    [HttpPost("{channelId}/unsubscribe")]
    [Authorize]
    public async Task<ActionResult<bool>> Unsubscribe(Guid channelId)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var result = await _userService.UnsubscribeAsync(userGuid, channelId);
            
            if (!result)
            {
                return BadRequest(new { error = new { message = "Подписка не найдена" } });
            }

            return Ok(true);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Проверка, подписан ли текущий пользователь на канал
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Результат проверки подписки</returns>
    [HttpGet("{channelId}/is-subscribed")]
    [Authorize]
    public async Task<ActionResult<bool>> IsSubscribed(Guid channelId)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var result = await _userService.IsSubscribedAsync(userGuid, channelId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Получение количества подписчиков канала
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Количество подписчиков</returns>
    [HttpGet("{channelId}/subscriber-count")]
    public async Task<ActionResult<int>> GetSubscriberCount(Guid channelId)
    {
        try
        {
            var count = await _userService.GetSubscriberCountAsync(channelId);

            return Ok(count);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
}