using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VideoHosting.Infrastructure.Services;

namespace VideoHosting.Api.BackgroundServices;

public class DailyStatisticsBackgroundService : BackgroundService
{
    private readonly ILogger<DailyStatisticsBackgroundService> _logger;
    private readonly IServiceScopeFactory _serviceScopeFactory;

    public DailyStatisticsBackgroundService(
        ILogger<DailyStatisticsBackgroundService> logger,
        IServiceScopeFactory serviceScopeFactory)
    {
        _logger = logger;
        _serviceScopeFactory = serviceScopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Daily Statistics Background Service запущен");

        using PeriodicTimer timer = new(TimeSpan.FromHours(1));

        while (!stoppingToken.IsCancellationRequested &&
               await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await UpdateDailyStatisticsAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обновлении ежедневной статистики");
            }
        }
    }

    private async Task UpdateDailyStatisticsAsync()
    {
        _logger.LogInformation("Обновление ежедневной статистики в {Time}", DateTimeOffset.Now);

        using var scope = _serviceScopeFactory.CreateScope();
        var dailyStatsService = scope.ServiceProvider.GetRequiredService<DailyStatisticsService>();
        
        await dailyStatsService.UpdateDailyStatisticsAsync();
        
        _logger.LogInformation("Ежедневная статистика успешно обновлена");
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Daily Statistics Background Service остановлен");
        await base.StopAsync(cancellationToken);
    }
}