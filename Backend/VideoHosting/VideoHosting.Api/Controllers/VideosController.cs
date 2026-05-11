using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Api.Models;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideosController : ControllerBase
{
    private readonly IVideoService _videoService;
    private readonly IMinioService _minioService;
    private readonly IRabbitMqService _rabbitMqService;

    public VideosController(
        IVideoService videoService,
        IMinioService minioService,
        IRabbitMqService rabbitMqService)
    {
        _videoService = videoService;
        _minioService = minioService;
        _rabbitMqService = rabbitMqService;
    }

    /// <summary>
    /// Загрузка нового видео
    /// </summary>
    /// <param name="uploadDto">Данные для загрузки видео</param>
    /// <returns>Информация о загруженном видео</returns>
    [HttpPost("upload")]
    [Authorize]
public async Task<ActionResult<VideoDto>> UploadVideo([FromForm] VideoUploadDto uploadDto)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Загрузка видео файла в MinIO
            var videoFileName = $"{Guid.NewGuid()}_{uploadDto.VideoFile.FileName}";
            var videoUrl = await _minioService.UploadVideoAsync(
                uploadDto.VideoFile.OpenReadStream(),
                videoFileName,
                uploadDto.VideoFile.ContentType);

            // Загрузка миниатюры (если предоставлена)
            string? thumbnailUrl = null;
            if (uploadDto.ThumbnailFile != null)
            {
                var thumbnailFileName = $"{Guid.NewGuid()}_{uploadDto.ThumbnailFile.FileName}";
                thumbnailUrl = await _minioService.UploadThumbnailAsync(
                    uploadDto.ThumbnailFile.OpenReadStream(),
                    thumbnailFileName,
                    uploadDto.ThumbnailFile.ContentType);
            }

            // Создание записи о видео в БД
            var videoDto = new VideoDto
            {
                Id = Guid.NewGuid(),
                Title = uploadDto.Title,
                Description = uploadDto.Description,
                OriginalVideoUrl = videoUrl,
                ThumbnailUrl = thumbnailUrl,
                Status = "Processing",
                UserId = userGuid,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = new UserDto { Id = userGuid } // Заполняем только ID пользователя
            };

            var createdVideo = await _videoService.CreateVideoAsync(videoDto);

            // Публикация события в RabbitMQ для обработки
            await _rabbitMqService.PublishVideoProcessingMessageAsync(createdVideo.Id, videoUrl);

            return Ok(createdVideo);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

            // Загрузка видео файла в MinIO
            var videoFileName = $"{Guid.NewGuid()}_{uploadDto.VideoFile.FileName}";
            var videoUrl = await _minioService.UploadVideoAsync(
                uploadDto.VideoFile.OpenReadStream(),
                videoFileName,
                uploadDto.VideoFile.ContentType);

            // Загрузка миниатюры (если предоставлена)
            string? thumbnailUrl = null;
            if (uploadDto.ThumbnailFile != null)
            {
                var thumbnailFileName = $"{Guid.NewGuid()}_{uploadDto.ThumbnailFile.FileName}";
                thumbnailUrl = await _minioService.UploadThumbnailAsync(
                    uploadDto.ThumbnailFile.OpenReadStream(),
                    thumbnailFileName,
                    uploadDto.ThumbnailFile.ContentType);
            }

            // Создание записи о видео в БД
            var videoDto = new VideoDto
            {
                Id = Guid.NewGuid(),
                Title = uploadDto.Title,
                Description = uploadDto.Description,
                OriginalVideoUrl = videoUrl,
                ThumbnailUrl = thumbnailUrl,
                Status = "Processing",
                UserId = userGuid,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                User = new UserDto { Id = userGuid } // Заполняем только ID пользователя
            };

            var createdVideo = await _videoService.CreateVideoAsync(videoDto);

            // Публикация события в RabbitMQ для обработки
            await _rabbitMqService.PublishVideoProcessingMessageAsync(createdVideo.Id, videoUrl);

            return Ok(ApiResponse<VideoDto>.Ok(createdVideo, "Видео успешно загружено и отправлено на обработку"));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<VideoDto>.Error("Произошла внутренняя ошибка сервера", new List<string> { ex.Message }));
        }
    }

    /// <summary>
    /// Получение списка видео с фильтрацией и пагинацией
    /// </summary>
    /// <param name="request">Параметры запроса списка видео</param>
    /// <returns>Список видео</returns>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<VideoDto>>> GetVideos([FromQuery] VideoListRequestDto request)
    {
        try
        {
            // Получение всех видео (в дальнейшем можно добавить фильтрацию)
            var videos = await _videoService.GetAllVideosAsync();

            // Применение поиска по названию
            if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                videos = videos.Where(v => v.Title.Contains(request.SearchTerm, StringComparison.OrdinalIgnoreCase));
            }

            // Применение сортировки
            videos = request.SortDescending
                ? videos.OrderByDescending(v => GetSortProperty(v, request.SortBy))
                : videos.OrderBy(v => GetSortProperty(v, request.SortBy));

            // Применение пагинации
            var paginatedVideos = videos
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize);

            return Ok(paginatedVideos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Получение информации о конкретном видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Информация о видео</returns>
    [HttpGet("{id}")]
    public async Task<ActionResult<VideoDto>> GetVideo(Guid id)
    {
        try
        {
            var video = await _videoService.GetVideoByIdAsync(id);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            return Ok(video);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Обновление информации о видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <param name="videoDto">Обновленные данные видео</param>
    /// <returns>Обновленная информация о видео</returns>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<VideoDto>> UpdateVideo(Guid id, [FromBody] VideoDto videoDto)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Проверка, что видео принадлежит пользователю
            var existingVideo = await _videoService.GetVideoByIdAsync(id);
            if (existingVideo == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            if (existingVideo.User.Id != userGuid)
            {
                return Forbid("Нет прав для обновления видео другого пользователя");
            }

            // Обновление данных видео
            videoDto.Id = id;
            videoDto.UserId = userGuid;
            videoDto.UpdatedAt = DateTime.UtcNow;

            await _videoService.UpdateVideoAsync(videoDto);

            return Ok(videoDto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    /// <summary>
    /// Удаление видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Результат удаления</returns>
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<ActionResult<bool>> DeleteVideo(Guid id)
    {
        try
        {
            // Получение ID пользователя из токена
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            // Проверка, что видео принадлежит пользователю
            var existingVideo = await _videoService.GetVideoByIdAsync(id);
            if (existingVideo == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            if (existingVideo.User.Id != userGuid)
            {
                return Forbid("Нет прав для удаления видео другого пользователя");
            }

            // Удаление видео
            await _videoService.DeleteVideoAsync(id);

            return Ok(true);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    

    /// <summary>
    /// Увеличение счетчика просмотров видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Результат увеличения счетчика</returns>
    [HttpPost("{id}/view")]
    public async Task<ActionResult<bool>> IncrementViewCount(Guid id)
    {
        try
        {
            var video = await _videoService.GetVideoByIdAsync(id);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            // Увеличение счетчика просмотров
            video.Views += 1;
            await _videoService.UpdateVideoAsync(video);

            return Ok(true);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    private bool TryGetCurrentUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return !string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out userId);
    }
    
    private async Task<VideoDto?> GetVideoWithErrorHandling(Guid id, HttpResponse response)
    {
        var video = await _videoService.GetVideoByIdAsync(id);
        if (video == null)
        {
            response.StatusCode = 404;
            return null;
        }
        return video;
    }
    
    /// <summary>
    /// Лайк видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Результат лайка</returns>
    [HttpPost("{id}/like")]
    [Authorize]
    public async Task<ActionResult<object>> LikeVideo(Guid id)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var video = await GetVideoWithErrorHandling(id, Response);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            // Добавляем или обновляем реакцию пользователя
            await _videoService.AddOrUpdateReactionAsync(userGuid, id, "Like");

            // Получаем обновленный видео для возврата актуальных счетчиков
            var updatedVideo = await _videoService.GetVideoByIdAsync(id);
            
            return Ok(new 
            { 
                likes = updatedVideo.Likes, 
                dislikes = updatedVideo.Dislikes, 
                is_liked = true, 
                is_disliked = false 
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Дизлайк видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Результат дизлайка</returns>
    [HttpPost("{id}/dislike")]
    [Authorize]
    public async Task<ActionResult<object>> DislikeVideo(Guid id)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var video = await GetVideoWithErrorHandling(id, Response);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            // Добавляем или обновляем реакцию пользователя
            await _videoService.AddOrUpdateReactionAsync(userGuid, id, "Dislike");

            // Получаем обновленный видео для возврата актуальных счетчиков
            var updatedVideo = await _videoService.GetVideoByIdAsync(id);
            
            return Ok(new 
            { 
                likes = updatedVideo.Likes, 
                dislikes = updatedVideo.Dislikes, 
                is_liked = false, 
                is_disliked = true 
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = new { message = ex.Message } });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Удаление реакции пользователя на видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Результат удаления реакции</returns>
    [HttpDelete("{id}/reaction")]
    [Authorize]
    public async Task<ActionResult<object>> RemoveReaction(Guid id)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var video = await GetVideoWithErrorHandling(id, Response);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            // Удаляем реакцию пользователя
            await _videoService.RemoveReactionAsync(userGuid, id);

            // Получаем обновленный видео для возврата актуальных счетчиков
            var updatedVideo = await _videoService.GetVideoByIdAsync(id);
            
            return Ok(new 
            { 
                likes = updatedVideo.Likes, 
                dislikes = updatedVideo.Dislikes, 
                is_liked = false, 
                is_disliked = false 
            });
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
    
    /// <summary>
    /// Получение реакции текущего пользователя на видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Реакция пользователя</returns>
    [HttpGet("{id}/reaction")]
    [Authorize]
    public async Task<ActionResult<VideoReactionDto>> GetUserReaction(Guid id)
    {
        try
        {
            // Получение ID пользователя из токена
            if (!TryGetCurrentUserId(out var userGuid))
            {
                return Unauthorized(new { error = new { message = "Неверный токен доступа" } });
            }

            var video = await GetVideoWithErrorHandling(id, Response);
            if (video == null)
            {
                return NotFound(new { error = new { message = "Видео не найдено" } });
            }

            // Получаем реакцию пользователя
            var reaction = await _videoService.GetUserReactionAsync(userGuid, id);
            
            if (reaction == null)
            {
                return Ok(null);
            }

            return Ok(reaction);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }

    private object GetSortProperty(VideoDto video, string? sortBy)
    {
        return sortBy?.ToLower() switch
        {
            "title" => video.Title,
            "createdat" => video.CreatedAt,
            "views" => video.Views,
            "likes" => video.Likes,
            _ => video.CreatedAt
        };
    }
    
    /// <summary>
    /// Получение статуса обработки видео
    /// </summary>
    /// <param name="id">ID видео</param>
    /// <returns>Статус обработки видео</returns>
    [HttpGet("{id}/processing-status")]
    public async Task<ActionResult<VideoProcessingStatusDto>> GetVideoProcessingStatus(Guid id)
    {
        try
        {
            var status = await _videoService.GetVideoProcessingStatusAsync(id);
            return Ok(status);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = new { message = ex.Message } });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = new { message = "Произошла внутренняя ошибка сервера" } });
        }
    }
}