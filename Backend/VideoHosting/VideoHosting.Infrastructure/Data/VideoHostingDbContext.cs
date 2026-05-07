using Microsoft.EntityFrameworkCore;
using VideoHosting.Domain.Entities;

namespace VideoHosting.Infrastructure.Data;

public class VideoHostingDbContext : DbContext
{
    public VideoHostingDbContext(DbContextOptions<VideoHostingDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Video> Videos { get; set; } = null!;
    public DbSet<Comment> Comments { get; set; } = null!;
    public DbSet<Subscription> Subscriptions { get; set; } = null!;
    public DbSet<VideoReaction> VideoReactions { get; set; } = null!;
    public DbSet<AdminActionLog> AdminActionLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // Video entity configuration
        modelBuilder.Entity<Video>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(255);
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("Processing");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
            
            entity.HasOne(v => v.User)
                .WithMany(u => u.Videos)
                .HasForeignKey(v => v.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Comment entity configuration
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
            
            entity.HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(c => c.Video)
                .WithMany(v => v.Comments)
                .HasForeignKey(c => c.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Subscription entity configuration
        modelBuilder.Entity<Subscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.SubscriberId, e.ChannelId }).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            
            entity.HasOne(s => s.Subscriber)
                .WithMany(u => u.Subscriptions)
                .HasForeignKey(s => s.SubscriberId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasPrincipalKey(u => u.Id);
                
            entity.HasOne(s => s.Channel)
                .WithMany()
                .HasForeignKey(s => s.ChannelId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasPrincipalKey(u => u.Id);
        });

        // VideoReaction entity configuration
        modelBuilder.Entity<VideoReaction>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.VideoId }).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("NOW()");
            
            entity.HasOne(vr => vr.User)
                .WithMany(u => u.VideoReactions)
                .HasForeignKey(vr => vr.UserId)
                .OnDelete(DeleteBehavior.Cascade);
                
            entity.HasOne(vr => vr.Video)
                .WithMany(v => v.VideoReactions)
                .HasForeignKey(vr => vr.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });
        
        // AdminActionLog entity configuration
        modelBuilder.Entity<AdminActionLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).HasMaxLength(100);
            entity.Property(e => e.TargetType).HasMaxLength(50);
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("NOW()");
            
            entity.HasOne(l => l.AdminUser)
                .WithMany()
                .HasForeignKey(l => l.AdminUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}