using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface IAdminActionLogRepository
{
    Task<AdminActionLog> CreateAsync(AdminActionLog log);
}