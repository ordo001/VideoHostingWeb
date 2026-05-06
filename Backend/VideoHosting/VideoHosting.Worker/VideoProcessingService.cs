using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Worker.Services;

namespace VideoHosting.Worker;

public class VideoProcessingService : IHostedService
{
    private readonly ILogger<VideoProcessingService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly FFmpegVideoProcessor _videoProcessor;
    private readonly IConnection _rabbitMqConnection;
    private readonly IModel _rabbitMqChannel;
    
    public VideoProcessingService(
        ILogger<VideoProcessingService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _videoProcessor = new FFmpegVideoProcessor();
        
        // Настройка RabbitMQ
        var factory = new ConnectionFactory()
        {
            HostName = "localhost",
            UserName = "guest",
            Password = "guest"
        };
        
        _rabbitMqConnection = factory.CreateConnection();
        _rabbitMqChannel = _rabbitMqConnection.CreateModel();
        
        // Объявление очереди для обработки видео
        _rabbitMqChannel.QueueDeclare(queue: "video-processing",
                                     durable: true,
                                     exclusive: false,
                                     autoDelete: false,
                                     arguments: null);
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Video Processing Service is starting.");
        
        // Настройка потребителя RabbitMQ
        var consumer = new EventingBasicConsumer(_rabbitMqChannel);
        consumer.Received += async (model, ea) =>
        {
            try
            {
                var body = ea.Body.ToArray();
                var message = JsonSerializer.Deserialize<VideoProcessingMessage>(body);
                
                if (message != null)
                {
                    await ProcessVideoAsync(message.VideoId, message.VideoFilePath);
                    
                    // Подтверждение обработки сообщения
                    _rabbitMqChannel.BasicAck(ea.DeliveryTag, false);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обработке видео");
                // Отрицательное подтверждение для повторной обработки
                _rabbitMqChannel.BasicNack(ea.DeliveryTag, false, true);
            }
        };
        
        // Начало потребления сообщений
        _rabbitMqChannel.BasicConsume(queue: "video-processing",
                                     autoAck: false,
                                     consumer: consumer);
        
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Video Processing Service is stopping.");
        
        _rabbitMqChannel?.Close();
        _rabbitMqConnection?.Close();
        
        return Task.CompletedTask;
    }
    
    private async Task ProcessVideoAsync(Guid videoId, string videoFilePath)
    {
        _logger.LogInformation("Начало обработки видео {VideoId}", videoId);
        
        using var scope = _serviceProvider.CreateScope();
        var videoRepository = scope.ServiceProvider.GetRequiredService<IVideoRepository>();
        var minioService = scope.ServiceProvider.GetRequiredService<IMinioService>();
        
        try
        {
            // Получаем видео из базы данных
            var video = await videoRepository.GetByIdAsync(videoId);
            if (video == null)
            {
                _logger.LogWarning("Видео {VideoId} не найдено", videoId);
                return;
            }
            
            // Обновляем статус на Processing
            video.Status = "Processing";
            video.UpdatedAt = DateTime.UtcNow;
            await videoRepository.UpdateAsync(video);
            
            // Скачиваем видео из MinIO
            var tempVideoPath = await _videoProcessor.DownloadVideoFromMinioAsync(videoFilePath);
            
            // Создаем временную директорию для обработки
            var tempProcessingDir = Path.Combine(Path.GetTempPath(), $"video_{videoId}");
            Directory.CreateDirectory(tempProcessingDir);
            
            try
            {
                // Транскодируем видео в несколько разрешений
                await _videoProcessor.TranscodeToMultipleResolutionsAsync(
                    tempVideoPath,
                    tempProcessingDir,
                    progress => _logger.LogInformation("Прогресс обработки видео {VideoId}: {Progress}%", videoId, progress));
                
                // Генерируем мастер плейлист
                _videoProcessor.GenerateMasterPlaylist(tempProcessingDir, videoId);
                
                // Загружаем HLS файлы в MinIO
                await _videoProcessor.UploadHlsFilesToMinioAsync(
                    videoId.ToString(),
                    tempProcessingDir,
                    (filePath, objectName, contentType) =>
                    {
                        using var fileStream = File.OpenRead(filePath);
                        // В реальной реализации здесь будет вызов MinIO для загрузки файла
                        _logger.LogInformation("Загрузка файла {ObjectName} в MinIO", objectName);
                        return Task.FromResult($"streaming/{objectName}");
                    });
                
                // Обновляем статус видео на Ready
                video.Status = "Ready";
                video.HlsUrl = $"/streaming/{videoId}/master.m3u8";
                video.UpdatedAt = DateTime.UtcNow;
                await videoRepository.UpdateAsync(video);
                
                _logger.LogInformation("Видео {VideoId} успешно обработано", videoId);
            }
            finally
            {
                // Очищаем временные файлы
                _videoProcessor.CleanupTempFiles(tempProcessingDir);
                _videoProcessor.CleanupTempFiles(Path.GetDirectoryName(tempVideoPath)!);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при обработке видео {VideoId}", videoId);
            
            // Обновляем статус видео на Failed
            using var errorScope = _serviceProvider.CreateScope();
            var errorVideoRepository = errorScope.ServiceProvider.GetRequiredService<IVideoRepository>();
            var errorVideo = await errorVideoRepository.GetByIdAsync(videoId);
            if (errorVideo != null)
            {
                errorVideo.Status = "Failed";
                errorVideo.UpdatedAt = DateTime.UtcNow;
                await errorVideoRepository.UpdateAsync(errorVideo);
            }
        }
    }
}

public class VideoProcessingMessage
{
    public Guid VideoId { get; set; }
    public string VideoFilePath { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}