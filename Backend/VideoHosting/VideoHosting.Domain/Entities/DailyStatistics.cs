using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Domain.Entities;

public class DailyStatistics
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public DateTime Date { get; set; }
    
    public int NewUsers { get; set; }
    
    public int NewVideos { get; set; }
    
    public int NewViews { get; set; }
    
    public int NewLikes { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime UpdatedAt { get; set; }
}