using VideoHosting.Application.DTOs;
using VideoHosting.Application.Interfaces;
using VideoHosting.Domain.Entities;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenGenerator _tokenGenerator;

    public AuthService(IUserRepository userRepository, IPasswordHasher passwordHasher, ITokenGenerator tokenGenerator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto request)
    {
        // Проверка, что пользователь с таким email не существует
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Пользователь с таким email уже существует");
        }

        // Хеширование пароля
        var hashedPassword = _passwordHasher.HashPassword(request.Password);

        // Создание нового пользователя
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Email = request.Email,
            PasswordHash = hashedPassword,
            IsAdmin = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdUser = await _userRepository.CreateAsync(user);

        // Генерация токена
        var token = _tokenGenerator.GenerateToken(createdUser);

        // Создание DTO ответа
        var userDto = new UserDto
        {
            Id = createdUser.Id,
            Name = createdUser.Name,
            Email = createdUser.Email,
            AvatarUrl = createdUser.AvatarUrl,
            Description = createdUser.Description,
            IsAdmin = createdUser.IsAdmin,
            CreatedAt = createdUser.CreatedAt,
            UpdatedAt = createdUser.UpdatedAt
        };

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = userDto
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        // Поиск пользователя по email
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Неверный email или пароль");
        }

        // Проверка пароля
        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Неверный email или пароль");
        }

        // Генерация токена
        var token = _tokenGenerator.GenerateToken(user);

        // Создание DTO ответа
        var userDto = new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Description = user.Description,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };

        return new AuthResponseDto
        {
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            User = userDto
        };
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("Пользователь не найден");
        }

        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            AvatarUrl = user.AvatarUrl,
            Description = user.Description,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}