using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;
using VideoHosting.Infrastructure.Data;

namespace VideoHosting.Infrastructure.Services;

public class AdminActionLogRepository : IAdminActionLogRepository
{
    private readonly VideoHostingDbContext _context;

    public AdminActionLogRepository(VideoHostingDbContext context)
    {
        _context = context;
    }

    public async Task<AdminActionLog> CreateAsync(AdminActionLog log)
    {
        _context.AdminActionLogs.Add(log);
        await _context.SaveChangesAsync();
        return log;
    }
}