using Minio;
using Minio.DataModel.Args;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Infrastructure.Storage;

public class MinioService : IMinioService
{
    private readonly IMinioClient _minioClient;
    private const string VideoBucketName = "videos";
    private const string ThumbnailBucketName = "thumbnails";

    public MinioService(IMinioClient minioClient)
    {
        _minioClient = minioClient;
    }

    public async Task<string> UploadVideoAsync(Stream videoStream, string fileName, string contentType)
    {
        // Убедимся, что bucket существует
        await CreateBucketIfNotExists(VideoBucketName);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(VideoBucketName)
            .WithObject(fileName)
            .WithStreamData(videoStream)
            .WithObjectSize(videoStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs);

        // Возвращаем путь к файлу
        return $"videos/{fileName}";
    }

    public async Task<string> UploadThumbnailAsync(Stream thumbnailStream, string fileName, string contentType)
    {
        // Убедимся, что bucket существует
        await CreateBucketIfNotExists(ThumbnailBucketName);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(ThumbnailBucketName)
            .WithObject(fileName)
            .WithStreamData(thumbnailStream)
            .WithObjectSize(thumbnailStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs);

        // Возвращаем путь к файлу
        return $"thumbnails/{fileName}";
    }

    public async Task DeleteVideoAsync(string videoUrl)
    {
        var objectName = videoUrl.Replace("videos/", "");
        
        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(VideoBucketName)
            .WithObject(objectName);

        await _minioClient.RemoveObjectAsync(removeObjectArgs);
    }

    public async Task DeleteThumbnailAsync(string thumbnailUrl)
    {
        var objectName = thumbnailUrl.Replace("thumbnails/", "");
        
        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(ThumbnailBucketName)
            .WithObject(objectName);

        await _minioClient.RemoveObjectAsync(removeObjectArgs);
    }

    public async Task<string> GetPresignedUrlAsync(string objectName, int expirySeconds = 3600)
    {
        var presignedGetObjectArgs = new PresignedGetObjectArgs()
            .WithBucket(VideoBucketName)
            .WithObject(objectName)
            .WithExpiry(expirySeconds);

        return await _minioClient.PresignedGetObjectAsync(presignedGetObjectArgs);
    }

    private async Task CreateBucketIfNotExists(string bucketName)
    {
        var bucketExistsArgs = new BucketExistsArgs().WithBucket(bucketName);
        bool found = await _minioClient.BucketExistsAsync(bucketExistsArgs);

        if (!found)
        {
            var makeBucketArgs = new MakeBucketArgs().WithBucket(bucketName);
            await _minioClient.MakeBucketAsync(makeBucketArgs);
        }
    }
}