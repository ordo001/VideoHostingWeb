namespace VideoHosting.Application.DTOs;

public class PlatformStatsDto
{
    public int TotalUsers { get; set; }
    public int NewUsers { get; set; }
    public int TotalVideos { get; set; }
    public int NewVideos { get; set; }
    public int TotalViews { get; set; }
    public int NewViews { get; set; }
    public int TotalLikes { get; set; }
    public int NewLikes { get; set; }
    public UserGrowthDto[] UserGrowth { get; set; } = Array.Empty<UserGrowthDto>();
    public PopularVideoDto[] PopularVideos { get; set; } = Array.Empty<PopularVideoDto>();
    public ActivityGraphDto[] ActivityGraph { get; set; } = Array.Empty<ActivityGraphDto>();
    public UserGeographyDto[] UserGeography { get; set; } = Array.Empty<UserGeographyDto>();
}

public class UserGrowthDto
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class PopularVideoDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public int Views { get; set; }
    public int Likes { get; set; }
}

public class ActivityGraphDto
{
    public DateTime Date { get; set; }
    public int Views { get; set; }
    public int Uploads { get; set; }
    public int Registrations { get; set; }
}

public class UserGeographyDto
{
    public string Country { get; set; } = string.Empty;
    public int UserCount { get; set; }
    public float Percentage { get; set; }
}