using VideoHosting.Domain.Entities;

namespace VideoHosting.Domain.Interfaces;

public interface ITokenGenerator
{
    string GenerateToken(User user);
}