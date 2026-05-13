using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace VideoHosting.Application.DTOs;

public class VideoListRequestDto
{
    // Сохранить существующие свойства
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;  // Увеличим с 10 до 20 для соответствия параметру limit по умолчанию
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = true;
    
    // Добавить альтернативные имена для параметров
    [FromQuery(Name = "limit")]
    public int? Limit 
    { 
        get => PageSize; 
        set => PageSize = value ?? 20; 
    }
    
    [FromQuery(Name = "offset")]
    public int? Offset 
    { 
        get => (Page - 1) * PageSize; 
        set 
        { 
            if (value.HasValue && value.Value >= 0 && PageSize > 0)
                Page = (value.Value / PageSize) + 1; 
        }
    }
    
    [FromQuery(Name = "sort")]
    public string? Sort 
    { 
        get => SortBy; 
        set => SortBy = value; 
    }
    
    [FromQuery(Name = "order")]
    public string? Order 
    { 
        get => SortDescending ? "desc" : "asc";
        set => SortDescending = value?.ToLower() != "asc"; 
    }
}