using Minio;
using Minio.DataModel.Args;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Infrastructure.Storage;

public class MinioService : IMinioService
{
    private readonly IMinioClient _minioClient;
    private const string VideoBucketName = "videos";
    private const string ThumbnailBucketName = "thumbnails";
    private const string AvatarBucketName = "avatars";
    private const string BannerBucketName = "banners";

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

    public async Task<string> UploadAvatarAsync(Stream avatarStream, string fileName, string contentType)
    {
        // Убедимся, что bucket существует
        await CreateBucketIfNotExists(AvatarBucketName);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(AvatarBucketName)
            .WithObject(fileName)
            .WithStreamData(avatarStream)
            .WithObjectSize(avatarStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs);

        // Возвращаем путь к файлу
        return $"avatars/{fileName}";
    }

    public async Task<string> UploadBannerAsync(Stream bannerStream, string fileName, string contentType)
    {
        // Убедимся, что bucket существует
        await CreateBucketIfNotExists(BannerBucketName);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(BannerBucketName)
            .WithObject(fileName)
            .WithStreamData(bannerStream)
            .WithObjectSize(bannerStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs);

        // Возвращаем путь к файлу
        return $"banners/{fileName}";
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

    public async Task DeleteAvatarAsync(string avatarUrl)
    {
        var objectName = avatarUrl.Replace("avatars/", "");
        
        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(AvatarBucketName)
            .WithObject(objectName);

        await _minioClient.RemoveObjectAsync(removeObjectArgs);
    }

    public async Task DeleteBannerAsync(string bannerUrl)
    {
        var objectName = bannerUrl.Replace("banners/", "");
        
        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(BannerBucketName)
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

    public async Task<Stream> DownloadFileAsync(string objectName)
    {
        // Создаем MemoryStream для хранения данных файла
        var memoryStream = new MemoryStream();
        
        // Определяем имя объекта и bucket
        string bucketName;
        string actualObjectName;
        
        if (objectName.StartsWith("videos/"))
        {
            bucketName = VideoBucketName;
            actualObjectName = objectName.Replace("videos/", "");
        }
        else if (objectName.StartsWith("thumbnails/"))
        {
            bucketName = ThumbnailBucketName;
            actualObjectName = objectName.Replace("thumbnails/", "");
        }
        else if (objectName.StartsWith("avatars/"))
        {
            bucketName = AvatarBucketName;
            actualObjectName = objectName.Replace("avatars/", "");
        }
        else if (objectName.StartsWith("banners/"))
        {
            bucketName = BannerBucketName;
            actualObjectName = objectName.Replace("banners/", "");
        }
        else
        {
            bucketName = VideoBucketName;
            actualObjectName = objectName;
        }

        var getObjectArgs = new GetObjectArgs()
            .WithBucket(bucketName)
            .WithObject(actualObjectName)
            .WithCallbackStream(stream =>
            {
                stream.CopyTo(memoryStream);
            });

        await _minioClient.GetObjectAsync(getObjectArgs);
        
        // Устанавливаем позицию в начало потока
        memoryStream.Position = 0;
        
        return memoryStream;
    }
    
    public async Task<string> UploadFileAsync(Stream fileStream, string objectName, string contentType, string bucketName = "videos")
    {
        // Убедимся, что bucket существует
        await CreateBucketIfNotExists(bucketName);

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(bucketName)
            .WithObject(objectName)
            .WithStreamData(fileStream)
            .WithObjectSize(fileStream.Length)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(putObjectArgs);

        // Возвращаем путь к файлу
        return $"{bucketName}/{objectName}";
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