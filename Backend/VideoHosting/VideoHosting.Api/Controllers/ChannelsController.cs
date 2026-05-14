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
public class ChannelsController : ControllerBase
{
    private readonly IUserService _userService;

    public ChannelsController(IUserService userService)
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
    /// Получение информации о канале по ID
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Информация о канале</returns>
    [HttpGet("{channelId}")]
    public async Task<ActionResult<UserDto>> GetChannelById(Guid channelId)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(channelId);
            if (user == null)
            {
                return NotFound(new { error = new { message = "Канал не найден" } });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Получение информации о своем канале
    /// </summary>
    /// <returns>Информация о канале текущего пользователя</returns>
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetMyChannel()
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
    /// Подписка на канал
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Результат подписки</returns>
    [HttpPost("{channelId}/subscribe")]
    [Authorize]
    public async Task<ActionResult<bool>> SubscribeChannel(Guid channelId)
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
    public async Task<ActionResult<bool>> UnsubscribeChannel(Guid channelId)
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
    public async Task<ActionResult<bool>> CheckSubscriptionStatus(Guid channelId)
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
}