using VideoHosting.Application.DTOs;

namespace VideoHosting.Application.Interfaces;

public interface IAdminService
{
    // Управление пользователями
    Task<PaginatedResponseDto<AdminUserDto>> GetUsersAsync(AdminUserListRequestDto request);
    Task<bool> BanUserAsync(Guid userId, Guid adminId, BanUserRequestDto request, string ipAddress, string userAgent);
    Task<bool> UnbanUserAsync(Guid userId, Guid adminId, UnbanUserRequestDto request, string ipAddress, string userAgent);
    Task<bool> MakeUserAdminAsync(Guid userId, Guid adminId, AdminActionRequestDto request, string ipAddress, string userAgent);
    Task<bool> RevokeUserAdminAsync(Guid userId, Guid adminId, AdminActionRequestDto request, string ipAddress, string userAgent);
    
    // Модерация видео
    Task<PaginatedResponseDto<AdminVideoDto>> GetVideosAsync(AdminVideoListRequestDto request);
    Task<bool> ApproveVideoAsync(Guid videoId, Guid adminId, ApproveVideoRequestDto request, string ipAddress, string userAgent);
    Task<bool> RejectVideoAsync(Guid videoId, Guid adminId, RejectVideoRequestDto request, string ipAddress, string userAgent);
    
    // Статистика
    Task<PlatformStatsDto> GetPlatformStatsAsync(string period = "30d");
    Task<List<RecentVideoDto>> GetRecentVideosAsync(int count = 5);
    
    // Логи
    Task<PaginatedResponseDto<AdminActionLogDto>> GetLogsAsync(AdminLogsRequestDto request);
    Task LogAdminActionAsync(Guid adminId, string action, string targetType, Guid? targetId, string? reason, string? details, string ipAddress, string userAgent);
}