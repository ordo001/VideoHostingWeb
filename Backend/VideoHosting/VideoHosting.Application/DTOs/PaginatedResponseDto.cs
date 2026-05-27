namespace VideoHosting.Application.DTOs;

public class PaginatedResponseDto<T>
{
    public T[] Items { get; set; } = Array.Empty<T>();
    public int TotalItems { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
}