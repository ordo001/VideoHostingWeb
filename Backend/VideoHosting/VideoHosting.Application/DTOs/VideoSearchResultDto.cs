using System.Text.Json.Serialization;

namespace VideoHosting.Application.DTOs;

public class VideoSearchResultDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("thumbnail_url")]
    public string? ThumbnailUrl { get; set; }

    public int? Duration { get; set; }
}
