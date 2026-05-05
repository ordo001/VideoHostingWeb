using Microsoft.EntityFrameworkCore;
using VideoHosting.Infrastructure.Data;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Services;
using VideoHosting.Application.Interfaces;
using VideoHosting.Application.Services;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using VideoHosting.Api.Middleware;
using Minio;
using RabbitMQ.Client;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Add DbContext
builder.Services.AddDbContext<VideoHostingDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add MinIO client
builder.Services.AddSingleton<IMinioClient>(sp =>
{
    var minioClient = new MinioClient()
        .WithEndpoint("localhost:9000")
        .WithCredentials("minioadmin", "minioadmin")
        .Build();
    return minioClient;
});

// Add RabbitMQ connection
builder.Services.AddSingleton<IConnection>(sp =>
{
    var factory = new ConnectionFactory()
    {
        HostName = "localhost",
        UserName = "guest",
        Password = "guest"
    };
    return factory.CreateConnection();
});

// Add application services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVideoRepository, VideoRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<VideoHosting.Domain.Interfaces.IMinioService, VideoHosting.Infrastructure.Storage.MinioService>();
builder.Services.AddScoped<VideoHosting.Domain.Interfaces.IRabbitMqService, VideoHosting.Infrastructure.Messaging.RabbitMqService>();

// Add JWT Authentication
var secretKey = "video_hosting_secret_key_very_long_and_secure_for_jwt_signing";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "VideoHosting",
        ValidAudience = "VideoHostingUsers",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Add Authorization
builder.Services.AddAuthorization();

// Add support for IFormFile
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = long.MaxValue;
});
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = long.MaxValue;
    options.MemoryBufferThreshold = int.MaxValue;
});

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Apply migrations on startup if migrate argument is provided
var commandLineArgs = Environment.GetCommandLineArgs();
if (commandLineArgs.Contains("--migrate"))
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<VideoHostingDbContext>();
    await dbContext.Database.MigrateAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Container"))
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Add error handling middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();