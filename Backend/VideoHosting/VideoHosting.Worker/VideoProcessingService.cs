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
using Microsoft.Extensions.Configuration;
using System.Diagnostics;

namespace VideoHosting.Worker;

public class VideoProcessingService : IHostedService
{
    private readonly ILogger<VideoProcessingService> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly FFmpegVideoProcessor _videoProcessor;
    private IConnection? _rabbitMqConnection;
    private IModel? _rabbitMqChannel;
    
    public VideoProcessingService(
        ILogger<VideoProcessingService> logger,
        IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
        _videoProcessor = new FFmpegVideoProcessor();
    }
    
    private void InitializeRabbitMq()
    {
        // Получаем IConfiguration из serviceProvider
        var configuration = _serviceProvider.GetRequiredService<IConfiguration>();
        
        var hostName = configuration.GetValue<string>("RabbitMq:HostName") ?? "localhost";
        var userName = configuration.GetValue<string>("RabbitMq:UserName") ?? "guest";
        var password = configuration.GetValue<string>("RabbitMq:Password") ?? "guest";
        var port = configuration.GetValue<int?>("RabbitMq:Port") ?? 5672;
        
        _logger.LogInformation("Настройка подключения к RabbitMQ: Host={Host}, Port={Port}, User={User}", hostName, port, userName);
        
        // Настройка RabbitMQ из конфигурации
        var factory = new ConnectionFactory()
        {
            HostName = hostName,
            UserName = userName,
            Password = password,
            Port = port
        };
        
        // Попытки подключения с повторами
        var maxRetries = 5;
        var delay = TimeSpan.FromSeconds(5);
        
        for (int i = 0; i < maxRetries; i++)
        {
            try
            {
                _logger.LogInformation("Попытка подключения к RabbitMQ ({Attempt}/{MaxRetries})", i + 1, maxRetries);
                _rabbitMqConnection = factory.CreateConnection();
                _rabbitMqChannel = _rabbitMqConnection.CreateModel();
                
                // Объявление очереди для обработки видео
                _rabbitMqChannel.QueueDeclare(queue: "video-processing",
                                             durable: true,
                                             exclusive: false,
                                             autoDelete: false,
                                             arguments: null);
                
                _logger.LogInformation("Успешное подключение к RabbitMQ");
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Не удалось подключиться к RabbitMQ (попытка {Attempt}/{MaxRetries})", i + 1, maxRetries);
                if (i == maxRetries - 1)
                {
                    throw; // Если все попытки исчерпаны, пробрасываем исключение
                }
                
                Task.Delay(delay).Wait();
            }
        }
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Video Processing Service is starting.");
        
        // Инициализируем подключение к RabbitMQ
        InitializeRabbitMq();
        
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
        
        try
        {
            _rabbitMqChannel?.Close();
            _rabbitMqConnection?.Close();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при закрытии подключения к RabbitMQ");
        }
        finally
        {
            _rabbitMqChannel?.Dispose();
            _rabbitMqConnection?.Dispose();
        }
        
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
            _logger.LogInformation("Начало скачивания видео {VideoId} из MinIO", videoId);
            var tempVideoPath = await _videoProcessor.DownloadVideoFromMinioAsync(videoFilePath, minioService.DownloadFileAsync);
            _logger.LogInformation("Видео {VideoId} успешно скачано из MinIO. Путь: {Path}", videoId, tempVideoPath);
            
            // Создаем временную директорию для обработки
            var tempProcessingDir = Path.Combine(Path.GetTempPath(), $"video_{videoId}");
            Directory.CreateDirectory(tempProcessingDir);
            
            try
            {
                // Транскодируем видео в несколько разрешений
                _logger.LogInformation("Начало транскодирования видео {VideoId}", videoId);
                await _videoProcessor.TranscodeToMultipleResolutionsAsync(
                    tempVideoPath,
                    tempProcessingDir,
                    progress => _logger.LogInformation("Прогресс обработки видео {VideoId}: {Progress}%", videoId, progress));
                _logger.LogInformation("Видео {VideoId} успешно транскодировано", videoId);
                
                // Генерируем мастер плейлист
                _logger.LogInformation("Генерация мастер плейлиста для видео {VideoId}", videoId);
                _videoProcessor.GenerateMasterPlaylist(tempProcessingDir, videoId);
                
                // Загружаем HLS файлы в MinIO
                _logger.LogInformation("Начало загрузки HLS файлов для видео {VideoId} в MinIO", videoId);
                await _videoProcessor.UploadHlsFilesToMinioAsync(
                    videoId.ToString(),
                    tempProcessingDir,
                    async (filePath, objectName, contentType) =>
                    {
                        using var fileStream = File.OpenRead(filePath);
                        // Загружаем файл в MinIO через minioService
                        var fullPath = $"streaming/{objectName}";
                        var actualObjectName = fullPath.Replace("videos/", "").Replace("streaming/", "");
                        
                        var result = await minioService.UploadFileAsync(fileStream, actualObjectName, contentType, "videos");
                        
                        _logger.LogInformation("Файл {ObjectName} успешно загружен в MinIO", objectName);
                        return fullPath;
                    });
                _logger.LogInformation("HLS файлы видео {VideoId} успешно загружены в MinIO", videoId);
                
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