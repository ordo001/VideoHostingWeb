using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace VideoHosting.Worker;

public class VideoProcessingService : IHostedService
{
    private readonly ILogger<VideoProcessingService> _logger;

    public VideoProcessingService(ILogger<VideoProcessingService> logger)
    {
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Video Processing Service is starting.");
        
        // Здесь будет реализация обработки видео
        
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Video Processing Service is stopping.");
        return Task.CompletedTask;
    }
}