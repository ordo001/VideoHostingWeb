using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;

namespace VideoHosting.Api.Controllers;

[ApiController]
[Route("api")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly IUserService _userService;

    public CommentsController(ICommentService commentService, IUserService userService)
    {
        _commentService = commentService;
        _userService = userService;
    }

    /// <summary>
    /// Получение комментариев к видео
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <param name="limit">Лимит комментариев</param>
    /// <param name="offset">Смещение</param>
    /// <returns>Список комментариев</returns>
    [HttpGet("videos/{videoId}/comments")]
    public async Task<ActionResult<IEnumerable<CommentDto>>> GetComments(Guid videoId, [FromQuery] int limit = 20, [FromQuery] int offset = 0)
    {
        try
        {
            var comments = await _commentService.GetCommentsByVideoIdAsync(videoId, limit, offset);
            return Ok(comments);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Добавление комментария к видео
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <param name="createDto">Данные для создания комментария</param>
    /// <returns>Созданный комментарий</returns>
    [HttpPost("videos/{videoId}/comments")]
    [Authorize]
    public async Task<ActionResult<CommentDto>> AddComment(Guid videoId, [FromBody] CreateCommentDto createDto)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var comment = await _commentService.CreateCommentAsync(videoId, userGuid, createDto);
            return Ok(comment);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Обновление комментария
    /// </summary>
    /// <param name="commentId">ID комментария</param>
    /// <param name="updateDto">Обновленные данные комментария</param>
    /// <returns>Результат обновления</returns>
    [HttpPut("comments/{commentId}")]
    [Authorize]
    public async Task<ActionResult<bool>> UpdateComment(Guid commentId, [FromBody] UpdateCommentDto updateDto)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var result = await _commentService.UpdateCommentAsync(commentId, userGuid, updateDto);
            if (!result)
            {
                return NotFound(new { error = new { message = "Комментарий не найден" } });
            }

            return Ok(true);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Удаление комментария
    /// </summary>
    /// <param name="commentId">ID комментария</param>
    /// <returns>Результат удаления</returns>
    [HttpDelete("comments/{commentId}")]
    [Authorize]
    public async Task<ActionResult<bool>> DeleteComment(Guid commentId)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var result = await _commentService.DeleteCommentAsync(commentId, userGuid);
            if (!result)
            {
                return NotFound(new { error = new { message = "Комментарий не найден" } });
            }

            return Ok(true);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Получение количества комментариев к видео
    /// </summary>
    /// <param name="videoId">ID видео</param>
    /// <returns>Количество комментариев</returns>
    [HttpGet("videos/{videoId}/comments/count")]
    public async Task<ActionResult<int>> GetCommentCount(Guid videoId)
    {
        try
        {
            var count = await _commentService.GetCommentCountByVideoIdAsync(videoId);
            return Ok(count);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
}