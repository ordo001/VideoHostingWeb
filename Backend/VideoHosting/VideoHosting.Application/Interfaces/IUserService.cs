using VideoHosting.Application.DTOs;

namespace VideoHosting.Application.Interfaces;

public interface IUserService
{
    Task<UserDto?> GetUserByIdAsync(Guid id);
    Task<UserDto?> GetUserByEmailAsync(string email);
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto> CreateUserAsync(UserDto user);
    Task UpdateUserAsync(UserDto user);
    Task DeleteUserAsync(Guid id);
}