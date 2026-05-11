namespace VideoHosting.Domain.Interfaces;

public interface IMinioService
{
    Task<string> UploadVideoAsync(Stream videoStream, string fileName, string contentType);
    Task<string> UploadThumbnailAsync(Stream thumbnailStream, string fileName, string contentType);
    Task DeleteVideoAsync(string videoUrl);
    Task DeleteThumbnailAsync(string thumbnailUrl);
    Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 3600);
    Task<Stream> DownloadFileAsync(string objectName);
    Task<string> UploadFileAsync(Stream fileStream, string objectName, string contentType, string bucketName = "videos");
}