using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace VideoHosting.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        ApiResponse<object> response;
        
        switch (exception)
        {
            case UnauthorizedAccessException:
                response = ApiResponse<object>.Error("Неверные учетные данные", new List<string> { exception.Message });
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                break;
            case InvalidOperationException:
                response = ApiResponse<object>.Error("Ошибка операции", new List<string> { exception.Message });
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                break;
            case KeyNotFoundException:
                response = ApiResponse<object>.Error("Ресурс не найден", new List<string> { exception.Message });
                context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                break;
            default:
                response = ApiResponse<object>.Error("Внутренняя ошибка сервера", new List<string> { "Произошла внутренняя ошибка сервера" });
                context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                break;
        }

        var jsonResponse = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(jsonResponse);
    }
}