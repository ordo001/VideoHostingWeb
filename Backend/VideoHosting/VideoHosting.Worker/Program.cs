using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
    public static void Main(string[] args)
    {
        CreateHostBuilder(args).Build().Run();
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
                    var minioClient = new MinioClient()
                        .WithEndpoint("localhost:9000")
                        .WithCredentials("minioadmin", "minioadmin")
                        .Build();
                    return minioClient;
                });

                // Add RabbitMQ connection
                services.AddSingleton<IConnection>(sp =>
                {
                    var factory = new ConnectionFactory()
                    {
                        HostName = "localhost",
                        UserName = "guest",
                        Password = "guest"
                    };
                    return factory.CreateConnection();
                });

                // Add repositories
                services.AddScoped<IUserRepository, UserRepository>();
                services.AddScoped<IVideoRepository, VideoRepository>();
                services.AddScoped<IVideoReactionRepository, VideoReactionRepository>();
                services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
                services.AddScoped<IAdminActionLogRepository, AdminActionLogRepository>();

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