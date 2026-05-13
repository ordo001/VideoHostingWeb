using System.Text.Json.Serialization;

namespace VideoHosting.Application.DTOs;

public class CommentDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    [JsonPropertyName("author")]
    public UserDto User { get; set; } = null!;
    
    [JsonPropertyName("video_id")]
    public Guid VideoId { get; set; }
    
    // Дополнительные поля для управления обновлениями
    public DateTime? UpdatedAt { get; set; }
}