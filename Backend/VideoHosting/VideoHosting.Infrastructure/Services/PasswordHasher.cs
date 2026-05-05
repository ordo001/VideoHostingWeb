using VideoHosting.Domain.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace VideoHosting.Infrastructure.Services;

public class PasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        using (var sha256 = SHA256.Create())
        {
            // В реальном приложении здесь должен быть bcrypt или другой современный алгоритм
            // Для демонстрации используем SHA256 + соль
            var salt = "video_hosting_salt_2026"; // В реальном приложении соль должна быть уникальной для каждого пользователя
            var saltedPassword = password + salt;
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
            return Convert.ToBase64String(hashedBytes);
        }
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        var hashOfInput = HashPassword(password);
        return hashOfInput.Equals(hashedPassword);
    }
}