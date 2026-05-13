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
public class SubscriptionsController : ControllerBase
{
    private readonly IUserService _userService;

    public SubscriptionsController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Получение информации о канале
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Информация о канале</returns>
    [HttpGet("channels/{channelId}")]
    public async Task<ActionResult<UserDto>> GetChannelInfo(Guid channelId)
    {
        try
        {
            var channel = await _userService.GetUserByIdAsync(channelId);
            if (channel == null)
            {
                return NotFound(new { error = new { message = "Канал не найден" } });
            }

            return Ok(channel);
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
    [HttpPost("channels/{channelId}/subscribe")]
    [Authorize]
    public async Task<ActionResult<bool>> SubscribeChannel(Guid channelId)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
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
    [HttpPost("channels/{channelId}/unsubscribe")]
    [Authorize]
    public async Task<ActionResult<bool>> UnsubscribeChannel(Guid channelId)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
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
    /// Получение подписок текущего пользователя
    /// </summary>
    /// <returns>Список подписок пользователя</returns>
    [HttpGet("my/subscriptions")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetMySubscriptions()
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var subscriptions = await _userService.GetUserSubscriptionsAsync(userGuid);
            return Ok(subscriptions);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Получение подписчиков канала
    /// </summary>
    /// <param name="channelId">ID канала</param>
    /// <returns>Список подписчиков канала</returns>
    [HttpGet("channels/{channelId}/subscribers")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetChannelSubscribers(Guid channelId)
    {
        try
        {
            var subscribers = await _userService.GetChannelSubscribersAsync(channelId);
            return Ok(subscribers);
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
    [HttpGet("channels/{channelId}/is-subscribed")]
    [Authorize]
    public async Task<ActionResult<bool>> IsSubscribedToChannel(Guid channelId)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var isSubscribed = await _userService.IsSubscribedAsync(userGuid, channelId);
            return Ok(isSubscribed);
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
    [HttpGet("channels/{channelId}/subscriber-count")]
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