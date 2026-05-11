using System.Text.Json.Serialization;

namespace VideoHosting.Application.DTOs;

public class VideoDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    [JsonPropertyName("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }
    
    [JsonPropertyName("original_video_url")]
    public string? OriginalVideoUrl { get; set; }
    
    [JsonPropertyName("hls_url")]
    public string? HlsUrl { get; set; }
    
    public int? Duration { get; set; }
    public int Views { get; set; }
    public int Likes { get; set; }
    public int Dislikes { get; set; }
    
    [JsonPropertyName("processing_status")]
    public string Status { get; set; } = "Processing";
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Поля для состояний пользователя
    [JsonPropertyName("is_liked")]
    public bool IsLiked { get; set; }
    
    [JsonPropertyName("is_disliked")]
    public bool IsDisliked { get; set; }
    
    [JsonPropertyName("is_subscribed")]
    public bool IsSubscribed { get; set; }
    
    // Foreign key
    public Guid UserId { get; set; }
    
    // User information
    [JsonPropertyName("author")]
    public UserDto User { get; set; } = null!;
}