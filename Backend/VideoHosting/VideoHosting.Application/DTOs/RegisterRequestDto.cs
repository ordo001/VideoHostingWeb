using System.ComponentModel.DataAnnotations;

namespace VideoHosting.Application.DTOs;

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Имя пользователя обязательно")]
    [StringLength(100, ErrorMessage = "Имя пользователя должно быть длиной от 2 до 100 символов", MinimumLength = 2)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email обязателен")]
    [EmailAddress(ErrorMessage = "Некорректный формат email")]
    [StringLength(255, ErrorMessage = "Email должен быть длиной до 255 символов")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль обязателен")]
    [StringLength(100, ErrorMessage = "Пароль должен быть длиной от 6 до 100 символов", MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Compare("Password", ErrorMessage = "Пароли не совпадают")]
    public string ConfirmPassword { get; set; } = string.Empty;
}