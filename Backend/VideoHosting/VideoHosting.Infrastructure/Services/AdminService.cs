using Microsoft.EntityFrameworkCore;
using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Enums;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class AdminService : IAdminService
{
    private readonly VideoHostingDbContext _context;
    private readonly IUserService _userService;
    private readonly IVideoService _videoService;

    public AdminService(
        VideoHostingDbContext context,
        IUserService userService,
        IVideoService videoService)
    {
        _context = context;
        _userService = userService;
        _videoService = videoService;
    }

    public async Task<PaginatedResponseDto<AdminUserDto>> GetUsersAsync(AdminUserListRequestDto request)
    {
        var query = _context.Users.AsQueryable();

        // Применение фильтров
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            query = query.Where(u => 
                u.Name.Contains(request.SearchTerm) || 
                u.Email.Contains(request.SearchTerm));
        }

        if (request.IsBanned.HasValue)
        {
            query = query.Where(u => u.IsBanned == request.IsBanned);
        }

        if (request.IsAdmin.HasValue)
        {
            query = query.Where(u => u.IsAdmin == request.IsAdmin);
        }

        // Подсчет общего количества
        var totalItems = await query.CountAsync();

        // Применение пагинации
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                UserName = u.Name,
                Email = u.Email,
                IsBanned = u.IsBanned,
                BannedUntil = u.BannedUntil,
                BanReason = u.BanReason,
                IsAdmin = u.IsAdmin,
                RegistrationDate = u.CreatedAt,
                LastLoginDate = u.LastLoginAt,
                VideoCount = u.Videos.Count,
                TotalViews = u.Videos.Sum(v => v.Views),
                AvatarUrl = u.AvatarUrl
            })
            .ToListAsync();

        return new PaginatedResponseDto<AdminUserDto>
        {
            Items = users.ToArray(),
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling((double)totalItems / request.PageSize),
            CurrentPage = request.Page
        };
    }

    public async Task<bool> BanUserAsync(Guid userId, Guid adminId, BanUserRequestDto request, string ipAddress, string userAgent)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.IsBanned = true;
        user.BannedUntil = request.BannedUntil;
        user.BanReason = request.Reason;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Логирование действия
        await LogAdminActionAsync(
            adminId, 
            "BanUser", 
            "User", 
            userId, 
            request.Reason, 
            $"Banned until: {request.BannedUntil?.ToString("yyyy-MM-dd HH:mm:ss") ?? "Permanent"}",
            ipAddress, 
            userAgent);

        return true;
    }

    public async Task<bool> UnbanUserAsync(Guid userId, Guid adminId, UnbanUserRequestDto request, string ipAddress, string userAgent)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.IsBanned = false;
        user.BannedUntil = null;
        user.BanReason = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Логирование действия
        await LogAdminActionAsync(
            adminId, 
            "UnbanUser", 
            "User", 
            userId, 
            request.Reason, 
            null,
            ipAddress, 
            userAgent);

        return true;
    }

    public async Task<bool> MakeUserAdminAsync(Guid userId, Guid adminId, AdminActionRequestDto request, string ipAddress, string userAgent)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.IsAdmin = true;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Логирование действия
        await LogAdminActionAsync(
            adminId, 
            "MakeUserAdmin", 
            "User", 
            userId, 
            request.Reason, 
            null,
            ipAddress, 
            userAgent);

        return true;
    }

    public async Task<bool> RevokeUserAdminAsync(Guid userId, Guid adminId, AdminActionRequestDto request, string ipAddress, string userAgent)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return false;

        user.IsAdmin = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Логирование действия
        await LogAdminActionAsync(
            adminId, 
            "RevokeUserAdmin", 
            "User", 
            userId, 
            request.Reason, 
            null,
            ipAddress, 
            userAgent);

        return true;
    }

    public async Task<PaginatedResponseDto<AdminVideoDto>> GetVideosAsync(AdminVideoListRequestDto request)
    {
        var query = _context.Videos.Include(v => v.User).AsQueryable();

        // Применение фильтров
        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            query = query.Where(v => 
                v.Title.Contains(request.SearchTerm) || 
                (v.Description != null && v.Description.Contains(request.SearchTerm)) ||
                v.User.Name.Contains(request.SearchTerm));
        }

        if (!string.IsNullOrEmpty(request.ModerationStatus) && request.ModerationStatus != "All")
        {
            if (Enum.TryParse<ModerationStatus>(request.ModerationStatus, out var status))
            {
                query = query.Where(v => v.ModerationStatus == status);
            }
        }

        if (request.DateFrom.HasValue)
        {
            query = query.Where(v => v.CreatedAt >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(v => v.CreatedAt <= request.DateTo.Value);
        }

        // Подсчет общего количества
        var totalItems = await query.CountAsync();

        // Применение пагинации
        var videos = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new AdminVideoDto
            {
                Id = v.Id,
                Title = v.Title,
                Description = v.Description,
                AuthorId = v.UserId,
                AuthorName = v.User.Name,
                ThumbnailUrl = v.ThumbnailUrl,
                Duration = v.Duration,
                Views = v.Views,
                Likes = v.Likes,
                Dislikes = v.Dislikes,
                UploadDate = v.CreatedAt,
                ModerationStatus = v.ModerationStatus,
                ModerationDate = v.ModerationDate,
                ModeratedBy = v.ModeratedBy != null ? v.ModeratedBy.Name : null
            })
            .ToListAsync();

        return new PaginatedResponseDto<AdminVideoDto>
        {
            Items = videos.ToArray(),
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling((double)totalItems / request.PageSize),
            CurrentPage = request.Page
        };
    }

    public async Task<bool> ApproveVideoAsync(Guid videoId, Guid adminId, ApproveVideoRequestDto request, string ipAddress, string userAgent)
    {
        var video = await _context.Videos.FindAsync(videoId);
        if (video == null)
            return false;

        video.IsModerated = true;
        video.ModerationStatus = ModerationStatus.Approved;
        video.ModerationDate = DateTime.UtcNow;
        video.ModeratedById = adminId;
        video.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Логирование действия
        await LogAdminActionAsync(
            adminId, 
            "ApproveVideo", 
            "Video", 
            videoId, 
            request.Reason, 
            null,
            ipAddress, 
            userAgent);

        return true;
    }

    public async Task<bool> RejectVideoAsync(Guid videoId, Guid adminId, RejectVideoRequestDto request, string ipAddress, string userAgent)
    {
        var video = await _context.Videos.FindAsync(videoId);
        if (video == null)
            return false;

        video.IsModerated = true;
        video.ModerationStatus = ModerationStatus.Rejected;
        video.ModerationDate = DateTime.UtcNow;
        video.ModeratedById = adminId;
        video.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Логирование действия
        await LogAdminActionAsync(
            adminId, 
            "RejectVideo", 
            "Video", 
            videoId, 
            request.Reason, 
            null,
            ipAddress, 
            userAgent);

        return true;
    }

    public async Task<PlatformStatsDto> GetPlatformStatsAsync(string period = "30d")
    {
        var now = DateTime.UtcNow;
        var dateFrom = period switch
        {
            "24h" => now.AddHours(-24),
            "7d" => now.AddDays(-7),
            "30d" => now.AddDays(-30),
            _ => now.AddDays(-7) // default to 7d for invalid values (removed "all")
        };

        var isHourly = period == "24h";

        // Общая статистика
        var totalUsers = await _context.Users.CountAsync();
        var newUsers = await _context.Users.CountAsync(u => u.CreatedAt >= dateFrom);
        var totalVideos = await _context.Videos.CountAsync();
        var newVideos = await _context.Videos.CountAsync(v => v.CreatedAt >= dateFrom);
        var totalViews = await _context.VideoViews.CountAsync();
        var newViews = await _context.VideoViews.CountAsync(v => v.ViewedAt >= dateFrom);
        var totalLikes = await _context.VideoReactions.CountAsync(vr => vr.ReactionType == ReactionType.Like);
        var newLikes = await _context.VideoReactions.CountAsync(vr => vr.ReactionType == ReactionType.Like && vr.CreatedAt >= dateFrom);

        // Рост пользователей — почасовой для 24h, дневной для остальных
        if (isHourly)
        {
            var userGrowth = await _context.Users
                .Where(u => u.CreatedAt >= dateFrom)
                .GroupBy(u => new
                {
                    u.CreatedAt.Date,
                    u.CreatedAt.Hour
                })
                .Select(g => new UserGrowthDto
                {
                    Date = new DateTime(g.Key.Date.Year, g.Key.Date.Month, g.Key.Date.Day, g.Key.Hour, 0, 0, DateTimeKind.Utc),
                    Count = g.Count()
                })
                .OrderBy(g => g.Date)
                .ToListAsync();

            // Популярные видео
            var popularVideos = await _context.Videos
                .Include(v => v.User)
                .OrderByDescending(v => v.Views)
                .Take(5)
                .Select(v => new PopularVideoDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    AuthorName = v.User.Name,
                    Views = v.Views,
                    Likes = v.Likes
                })
                .ToListAsync();

            // График активности — единый почасовой запрос для просмотров
            var viewsByHour = await _context.VideoViews
                .Where(v => v.ViewedAt >= dateFrom)
                .GroupBy(v => new { v.ViewedAt.Date, v.ViewedAt.Hour })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Date.Year, g.Key.Date.Month, g.Key.Date.Day, g.Key.Hour, 0, 0, DateTimeKind.Utc),
                    Count = g.Count()
                })
                .ToListAsync();

            // Единый почасовой запрос для загрузок видео
            var uploadsByHour = await _context.Videos
                .Where(v => v.CreatedAt >= dateFrom)
                .GroupBy(v => new { v.CreatedAt.Date, v.CreatedAt.Hour })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Date.Year, g.Key.Date.Month, g.Key.Date.Day, g.Key.Hour, 0, 0, DateTimeKind.Utc),
                    Count = g.Count()
                })
                .ToListAsync();

            // Единый почасовой запрос для регистраций
            var regsByHour = await _context.Users
                .Where(u => u.CreatedAt >= dateFrom)
                .GroupBy(u => new { u.CreatedAt.Date, u.CreatedAt.Hour })
                .Select(g => new
                {
                    Date = new DateTime(g.Key.Date.Year, g.Key.Date.Month, g.Key.Date.Day, g.Key.Hour, 0, 0, DateTimeKind.Utc),
                    Count = g.Count()
                })
                .ToListAsync();

            var viewsDict = viewsByHour.ToDictionary(x => x.Date, x => x.Count);
            var uploadsDict = uploadsByHour.ToDictionary(x => x.Date, x => x.Count);
            var regsDict = regsByHour.ToDictionary(x => x.Date, x => x.Count);

            // Генерируем 24 почасовые точки
            var activityGraph = new List<ActivityGraphDto>();
            for (int i = 23; i >= 0; i--)
            {
                var hour = now.AddHours(-i);
                var key = new DateTime(hour.Year, hour.Month, hour.Day, hour.Hour, 0, 0, DateTimeKind.Utc);

                activityGraph.Add(new ActivityGraphDto
                {
                    Date = key,
                    Views = viewsDict.TryGetValue(key, out var v) ? v : 0,
                    Uploads = uploadsDict.TryGetValue(key, out var u) ? u : 0,
                    Registrations = regsDict.TryGetValue(key, out var r) ? r : 0
                });
            }

            // География пользователей (временно пусто, нужно отдельное хранение геоданных)
            var userGeography = new List<UserGeographyDto>();

            return new PlatformStatsDto
            {
                TotalUsers = totalUsers,
                NewUsers = newUsers,
                TotalVideos = totalVideos,
                NewVideos = newVideos,
                TotalViews = totalViews,
                NewViews = newViews,
                TotalLikes = totalLikes,
                NewLikes = newLikes,
                UserGrowth = userGrowth.ToArray(),
                PopularVideos = popularVideos.ToArray(),
                ActivityGraph = activityGraph.ToArray(),
                UserGeography = userGeography.ToArray()
            };
        }
        else
        {
            // Дневная агрегация (7d, 30d)
            var userGrowth = await _context.Users
                .Where(u => u.CreatedAt >= dateFrom)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new UserGrowthDto
                {
                    Date = g.Key,
                    Count = g.Count()
                })
                .OrderBy(g => g.Date)
                .ToListAsync();

            // Популярные видео
            var popularVideos = await _context.Videos
                .Include(v => v.User)
                .OrderByDescending(v => v.Views)
                .Take(5)
                .Select(v => new PopularVideoDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    AuthorName = v.User.Name,
                    Views = v.Views,
                    Likes = v.Likes
                })
                .ToListAsync();

            // График активности — единые дневные запросы
            // EF Core/Npgsql возвращает DateTime с Kind=Unspecified, поэтому нормализуем после материализации
            var viewsByDayRaw = await _context.VideoViews
                .Where(v => v.ViewedAt >= dateFrom)
                .GroupBy(v => v.ViewedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();
            var viewsByDay = viewsByDayRaw.Select(v => (Date: DateTime.SpecifyKind(v.Date, DateTimeKind.Utc), v.Count)).ToList();

            var uploadsByDayRaw = await _context.Videos
                .Where(v => v.CreatedAt >= dateFrom)
                .GroupBy(v => v.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();
            var uploadsByDay = uploadsByDayRaw.Select(v => (Date: DateTime.SpecifyKind(v.Date, DateTimeKind.Utc), v.Count)).ToList();

            var regsByDayRaw = await _context.Users
                .Where(u => u.CreatedAt >= dateFrom)
                .GroupBy(u => u.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Count = g.Count() })
                .ToListAsync();
            var regsByDay = regsByDayRaw.Select(v => (Date: DateTime.SpecifyKind(v.Date, DateTimeKind.Utc), v.Count)).ToList();

            var viewsDict = viewsByDay.ToDictionary(x => x.Date, x => x.Count);
            var uploadsDict = uploadsByDay.ToDictionary(x => x.Date, x => x.Count);
            var regsDict = regsByDay.ToDictionary(x => x.Date, x => x.Count);

            var days = (int)Math.Ceiling((now - dateFrom).TotalDays);
            var activityGraph = new List<ActivityGraphDto>();
            for (int i = 0; i <= days; i++)
            {
                var day = new DateTime(dateFrom.Date.AddDays(i).Ticks, DateTimeKind.Utc);

                activityGraph.Add(new ActivityGraphDto
                {
                    Date = day,
                    Views = viewsDict.TryGetValue(day, out var v) ? v : 0,
                    Uploads = uploadsDict.TryGetValue(day, out var u) ? u : 0,
                    Registrations = regsDict.TryGetValue(day, out var r) ? r : 0
                });
            }

            // География пользователей (временно пусто, нужно отдельное хранение геоданных)
            var userGeography = new List<UserGeographyDto>();

            return new PlatformStatsDto
            {
                TotalUsers = totalUsers,
                NewUsers = newUsers,
                TotalVideos = totalVideos,
                NewVideos = newVideos,
                TotalViews = totalViews,
                NewViews = newViews,
                TotalLikes = totalLikes,
                NewLikes = newLikes,
                UserGrowth = userGrowth.ToArray(),
                PopularVideos = popularVideos.ToArray(),
                ActivityGraph = activityGraph.ToArray(),
                UserGeography = userGeography.ToArray()
            };
        }
    }

    public async Task<PaginatedResponseDto<AdminActionLogDto>> GetLogsAsync(AdminLogsRequestDto request)
    {
        var query = _context.AdminActionLogs.Include(l => l.AdminUser).AsQueryable();

        // Применение фильтров
        if (request.AdminId.HasValue)
        {
            query = query.Where(l => l.AdminUserId == request.AdminId);
        }

        if (!string.IsNullOrEmpty(request.ActionType) && request.ActionType != "All")
        {
            query = query.Where(l => l.TargetType == request.ActionType);
        }

        if (!string.IsNullOrEmpty(request.Action))
        {
            query = query.Where(l => l.Action.Contains(request.Action));
        }

        if (request.DateFrom.HasValue)
        {
            query = query.Where(l => l.CreatedAt >= request.DateFrom.Value);
        }

        if (request.DateTo.HasValue)
        {
            query = query.Where(l => l.CreatedAt <= request.DateTo.Value);
        }

        // Подсчет общего количества
        var totalItems = await query.CountAsync();

        // Применение пагинации
        var logs = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(l => new AdminActionLogDto
            {
                Id = l.Id,
                AdminId = l.AdminUserId,
                AdminName = l.AdminUser.Name,
                Action = l.Action,
                ActionType = l.TargetType,
                TargetType = l.TargetType,
                TargetId = l.TargetId,
                Reason = l.Reason,
                Details = l.Details,
                IpAddress = l.IpAddress ?? "",
                UserAgent = l.UserAgent ?? "",
                Timestamp = l.CreatedAt,
                AdminAvatarUrl = l.AdminUser.AvatarUrl
            })
            .ToListAsync();

        return new PaginatedResponseDto<AdminActionLogDto>
        {
            Items = logs.ToArray(),
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling((double)totalItems / request.PageSize),
            CurrentPage = request.Page
        };
    }

    public async Task<List<RecentVideoDto>> GetRecentVideosAsync(int count = 5)
    {
        var recentVideos = await _context.Videos
            .Include(v => v.User)
            .OrderByDescending(v => v.CreatedAt)
            .Take(count)
            .Select(v => new RecentVideoDto
            {
                Id = v.Id,
                Title = v.Title,
                ThumbnailUrl = v.ThumbnailUrl,
                AuthorName = v.User.Name,
                CreatedAt = v.CreatedAt,
                ViewCount = v.VideoViews.Count()
            })
            .ToListAsync();

        return recentVideos;
    }

    public async Task LogAdminActionAsync(Guid adminId, string action, string targetType, Guid? targetId, string? reason, string? details, string ipAddress, string userAgent)
    {
        var log = new AdminActionLog
        {
            AdminUserId = adminId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Reason = reason,
            Details = details,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CreatedAt = DateTime.UtcNow
        };

        _context.AdminActionLogs.Add(log);
        await _context.SaveChangesAsync();
    }
}