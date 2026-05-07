namespace VideoHosting.Application.DTOs;

public class VideoProcessingStatusDto
{
    public string Status { get; set; } = string.Empty;
    public int Progress { get; set; }
    public List<string> Resolutions { get; set; } = new();
    public string? ErrorMessage { get; set; }
}