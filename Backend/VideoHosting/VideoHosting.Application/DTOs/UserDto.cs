using System.Text.Json.Serialization;

namespace VideoHosting.Application.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("avatar")]
    public string? AvatarUrl { get; set; }
    
    public string? Description { get; set; }
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [JsonPropertyName("subscribers_count")]
    public int SubscribersCount { get; set; }
}