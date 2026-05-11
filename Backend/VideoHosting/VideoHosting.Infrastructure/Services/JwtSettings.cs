namespace VideoHosting.Infrastructure.Services;

public static class JwtSettings
{
    public const string SecretKey = "video_hosting_secret_key_very_long_and_secure_for_jwt_signing";
    public const string Issuer = "VideoHosting";
    public const string Audience = "VideoHostingUsers";
    public const int ExpiryInHours = 24;
}