using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Minio;
using RabbitMQ.Client;
using VideoHosting.Application.Interfaces;
using VideoHosting.Application.Services;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;
using VideoHosting.Infrastructure.Messaging;
using VideoHosting.Infrastructure.Services;
using VideoHosting.Infrastructure.Storage;

namespace VideoHosting.Worker;

public class Program
{
    public static async Task Main(string[] args)
    {
        try
        {
            var host = CreateHostBuilder(args).Build();
            
            // Apply database migrations on startup
            using var scope = host.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<VideoHostingDbContext>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
            
            logger.LogInformation("Applying database migrations...");
            await dbContext.Database.MigrateAsync();
            logger.LogInformation("Database migrations applied successfully");
            
            await host.RunAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Application startup failed: {ex.Message}");
            throw;
        }
    }

    public static IHostBuilder CreateHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureServices((hostContext, services) =>
            {
                // Add DbContext
                services.AddDbContext<VideoHostingDbContext>(options =>
                    options.UseNpgsql(hostContext.Configuration.GetConnectionString("DefaultConnection")));

                // Add MinIO client
                services.AddSingleton<IMinioClient>(sp =>
                {
                    var configuration = sp.GetRequiredService<IConfiguration>();
                    var minioEndpoint = configuration.GetValue<string>("Minio:Endpoint") ?? "minio:9000";
                    var minioAccessKey = configuration.GetValue<string>("Minio:AccessKey") ?? "minioadmin";
                    var minioSecretKey = configuration.GetValue<string>("Minio:SecretKey") ?? "minioadmin";
                    
                    var minioClient = new MinioClient()
                        .WithEndpoint(minioEndpoint)
                        .WithCredentials(minioAccessKey, minioSecretKey)
                        .Build();
                    return minioClient;
                });

                // Add RabbitMQ connection factory
                services.AddSingleton<IConnectionFactory>(sp =>
                {
                    var configuration = sp.GetRequiredService<IConfiguration>();
                    var hostName = configuration.GetValue<string>("RabbitMQ:HostName") ?? "localhost";
                    var userName = configuration.GetValue<string>("RabbitMQ:UserName") ?? "guest";
                    var password = configuration.GetValue<string>("RabbitMQ:Password") ?? "guest";
                    var virtualHost = configuration.GetValue<string>("RabbitMQ:VirtualHost") ?? "/";
                    
                    return new ConnectionFactory
                    {
                        HostName = hostName,
                        UserName = userName,
                        Password = password,
                        VirtualHost = virtualHost,
                        DispatchConsumersAsync = true
                    };
                });

                // Add repositories
                services.AddScoped<IUserRepository, UserRepository>();
                services.AddScoped<IVideoRepository, VideoRepository>();
                services.AddScoped<IVideoReactionRepository, VideoReactionRepository>();
                services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
                services.AddScoped<IAdminActionLogRepository, AdminActionLogRepository>();
                services.AddScoped<ICommentRepository, CommentRepository>();

                // Add services
                services.AddScoped<IPasswordHasher, PasswordHasher>();
                services.AddScoped<ITokenGenerator, JwtTokenGenerator>();
                services.AddScoped<IAuthService, AuthService>();
                services.AddScoped<IUserService, UserService>();
                services.AddScoped<IVideoService, VideoService>();
                services.AddScoped<IMinioService, MinioService>();
                services.AddScoped<IRabbitMqService, RabbitMqService>();

                // Add hosted service
                services.AddHostedService<VideoProcessingService>();
            });
}