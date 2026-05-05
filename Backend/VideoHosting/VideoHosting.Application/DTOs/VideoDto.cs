namespace VideoHosting.Application.DTOs;

public class VideoDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? OriginalVideoUrl { get; set; }
    public string? HlsUrl { get; set; }
    public int? Duration { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public int Dislikes { get; set; }
    public string Status { get; set; } = "Processing";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Foreign key
    public Guid UserId { get; set; }
    
    // User information
    public UserDto User { get; set; } = null!;
}