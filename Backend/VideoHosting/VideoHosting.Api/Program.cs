using Microsoft.EntityFrameworkCore;
using VideoHosting.Infrastructure.Data;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Services;
using VideoHosting.Application.Interfaces;
using VideoHosting.Application.Services;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
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
        .WithEndpoint("minio:9000")
        .WithCredentials("minioadmin", "minioadmin")
        .Build();
    return minioClient;
});

// Add RabbitMQ connection
builder.Services.AddSingleton<IConnection>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    var factory = new ConnectionFactory()
    {
        HostName = configuration.GetValue<string>("RabbitMq:HostName") ?? "localhost",
        UserName = configuration.GetValue<string>("RabbitMq:UserName") ?? "guest",
        Password = configuration.GetValue<string>("RabbitMq:Password") ?? "guest",
        Port = configuration.GetValue<int?>("RabbitMq:Port") ?? 5672
    };
    return factory.CreateConnection();
});

// Add application services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IVideoRepository, VideoRepository>();
builder.Services.AddScoped<IVideoReactionRepository, VideoReactionRepository>();
builder.Services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
builder.Services.AddScoped<IAdminActionLogRepository, AdminActionLogRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<ITokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<ICommentService, CommentService>();
    builder.Services.AddScoped<IFileService, FileService>();
    builder.Services.AddScoped<IMinioService, VideoHosting.Infrastructure.Storage.MinioService>();
    builder.Services.AddScoped<IRabbitMqService, VideoHosting.Infrastructure.Messaging.RabbitMqService>();

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 10_737_418_240; // 10 GB
    serverOptions.Limits.MaxRequestBufferSize = 10_737_418_240;
    serverOptions.Limits.MaxResponseBufferSize = 10_737_418_240;
    serverOptions.Limits.MinRequestBodyDataRate = null; // Отключаем ограничение скорости
    serverOptions.Limits.MinResponseDataRate = null;
});

// Настройка FormOptions для мультипарт запросов
builder.Services.Configure<FormOptions>(options =>
{
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartBodyLengthLimit = 10_737_418_240; // 10 GB
    options.MemoryBufferThreshold = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

// Add JWT Authentication
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
            ValidIssuer = VideoHosting.Infrastructure.Services.JwtSettings.Issuer,
            ValidAudience = VideoHosting.Infrastructure.Services.JwtSettings.Audience,
            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(VideoHosting.Infrastructure.Services.JwtSettings.SecretKey))
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

// Add Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Video Hosting API", Version = "v1" });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
    });
    
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});


var app = builder.Build();

// Always apply migrations on startup
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<VideoHostingDbContext>();
    await dbContext.Database.MigrateAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Container"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Video Hosting API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();

app.UseCors(x =>
{
    x.WithOrigins("http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
});

// Add error handling middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();