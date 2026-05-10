using System.Diagnostics;

namespace VideoHosting.Worker.Services;

public class FFmpegVideoProcessor
{
    private readonly string _tempDirectory;
    
    public FFmpegVideoProcessor()
    {
        _tempDirectory = Path.Combine(Path.GetTempPath(), "video_processing");
        if (!Directory.Exists(_tempDirectory))
        {
            Directory.CreateDirectory(_tempDirectory);
        }
    }
    
    public async Task<string> DownloadVideoFromMinioAsync(string videoUrl, Func<string, Task<Stream>> downloadFunc)
    {
        var tempVideoPath = Path.Combine(_tempDirectory, $"{Guid.NewGuid()}.mp4");
        
        try
        {
            // Скачиваем видео из MinIO
            using var videoStream = await downloadFunc(videoUrl);
            
            // Проверяем, что поток не пустой
            if (videoStream == null || videoStream.Length == 0)
            {
                throw new InvalidOperationException("Получен пустой поток видео из MinIO");
            }
            
            // Сохраняем видео во временный файл
            using var fileStream = new FileStream(tempVideoPath, FileMode.Create, FileAccess.Write);
            await videoStream.CopyToAsync(fileStream);
            
            // Проверяем, что файл был создан и не пустой
            if (!File.Exists(tempVideoPath) || new FileInfo(tempVideoPath).Length == 0)
            {
                throw new InvalidOperationException("Видео файл не был создан или пустой");
            }
            
            // Дополнительная проверка целостности файла
            if (!await ValidateVideoFileAsync(tempVideoPath))
            {
                throw new InvalidOperationException("Видео файл поврежден или не является корректным видео файлом");
            }
        }
        catch (Exception ex)
        {
            // Удаляем частично созданный файл в случае ошибки
            if (File.Exists(tempVideoPath))
            {
                try
                {
                    File.Delete(tempVideoPath);
                }
                catch
                {
                    // Игнорируем ошибки удаления
                }
            }
            
            throw new InvalidOperationException($"Ошибка при скачивании видео из MinIO: {ex.Message}", ex);
        }
        
        return tempVideoPath;
    }
    
    public async Task TranscodeToMultipleResolutionsAsync(string inputPath, string outputDirectory, Action<int> onProgress)
    {
        var resolutions = new[]
        {
            new { Name = "1080p", Width = 1920, Height = 1080, Bitrate = 5000 },
            new { Name = "720p", Width = 1280, Height = 720, Bitrate = 2800 },
            new { Name = "480p", Width = 854, Height = 480, Bitrate = 1400 },
            new { Name = "360p", Width = 640, Height = 360, Bitrate = 800 }
        };
        
        for (int i = 0; i < resolutions.Length; i++)
        {
            var resolution = resolutions[i];
            var outputPath = Path.Combine(outputDirectory, $"stream_{resolution.Name}.m3u8");
            
            // Вызываем FFmpeg для транскодирования в нужное разрешение
            await TranscodeToResolutionAsync(inputPath, outputPath, resolution.Width, resolution.Height, resolution.Bitrate);
            
            // Сообщаем о прогрессе
            onProgress(((i + 1) * 100) / resolutions.Length);
        }
    }
    
    private async Task TranscodeToResolutionAsync(string inputPath, string outputPath, int width, int height, int bitrate)
    {
        try
        {
            // Создаем директорию для выходных файлов если она не существует
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
            
            // Команда FFmpeg для транскодирования с созданием HLS сегментов
            var arguments = $"-i \"{inputPath}\" " +
                           $"-vf scale={width}:{height} " +
                           $"-c:v libx264 " +
                           $"-preset fast " +
                           $"-crf 23 " +
                           $"-maxrate {bitrate}k " +
                           $"-bufsize {bitrate * 2}k " +
                           $"-g 60 " +
                           $"-sc_threshold 0 " +
                           $"-keyint_min 60 " +
                           $"-c:a aac " +
                           $"-b:a 128k " +
                           $"-f hls " +
                           $"-hls_time 10 " +
                           $"-hls_list_size 0 " +
                           $"-hls_segment_filename \"{Path.Combine(Path.GetDirectoryName(outputPath)!, $"{Path.GetFileNameWithoutExtension(outputPath)}_%05d.ts")}\" " +
                           $"\"{outputPath}\"";
            
            await RunFFmpegCommandAsync(arguments);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException($"Ошибка транскодирования в {width}x{height}: {ex.Message}", ex);
        }
    }
    
    public void GenerateMasterPlaylist(string outputDirectory, Guid videoId)
    {
        var masterPlaylistPath = Path.Combine(outputDirectory, "master.m3u8");
        var masterPlaylistContent = @"#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS=""avc1.42e01e,mp4a.40.2""
stream_360p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480,CODECS=""avc1.42e01e,mp4a.40.2""
stream_480p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,CODECS=""avc1.42e01e,mp4a.40.2""
stream_720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS=""avc1.42e01e,mp4a.40.2""
stream_1080p.m3u8";

        File.WriteAllText(masterPlaylistPath, masterPlaylistContent);
    }
    
    private async Task RunFFmpegCommandAsync(string arguments)
    {
        var processStartInfo = new ProcessStartInfo
        {
            FileName = "ffmpeg",
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        
        using var process = Process.Start(processStartInfo);
        if (process == null)
        {
            throw new InvalidOperationException("Не удалось запустить процесс FFmpeg");
        }
        
        // Читаем стандартный вывод и ошибки параллельно
        var outputTask = process.StandardOutput.ReadToEndAsync();
        var errorTask = process.StandardError.ReadToEndAsync();
        
        await process.WaitForExitAsync();
        
        if (process.ExitCode != 0)
        {
            var output = await outputTask;
            var errorOutput = await errorTask;
            
            // Логируем детали ошибки
            var errorMessage = $"FFmpeg завершился с ошибкой (код {process.ExitCode}):\nВыходные данные: {output}\nОшибки: {errorOutput}\nАргументы: {arguments}";
            throw new InvalidOperationException(errorMessage);
        }
    }
    
    public async Task UploadHlsFilesToMinioAsync(string videoId, string outputDirectory, Func<string, string, string, Task<string>> uploadFunc)
    {
        var files = Directory.GetFiles(outputDirectory, "*.*", SearchOption.AllDirectories);
        
        foreach (var file in files)
        {
            var relativePath = Path.GetRelativePath(outputDirectory, file);
            var fileName = Path.GetFileName(file);
            var contentType = GetContentType(fileName);
            
            // Загружаем файл в MinIO
            await uploadFunc(file, $"{videoId}/{relativePath}", contentType);
        }
    }
    
    private string GetContentType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return extension switch
        {
            ".m3u8" => "application/vnd.apple.mpegurl",
            ".ts" => "video/mp2t",
            _ => "application/octet-stream"
        };
    }
    
    public void CleanupTempFiles(string tempDirectory)
    {
        try
        {
            if (Directory.Exists(tempDirectory))
            {
                Directory.Delete(tempDirectory, true);
            }
        }
        catch
        {
            // Игнорируем ошибки очистки
        }
    }
    
    private async Task<bool> ValidateVideoFileAsync(string filePath)
    {
        try
        {
            // Используем FFprobe для проверки целостности видео файла
            var arguments = $"-v quiet -show_streams -show_format -print_format json \"{filePath}\"";
            var processStartInfo = new ProcessStartInfo
            {
                FileName = "ffprobe",
                Arguments = arguments,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            
            using var process = Process.Start(processStartInfo);
            if (process == null)
            {
                // Если не удалось запустить ffprobe, пропускаем проверку
                return true;
            }
            
            await process.WaitForExitAsync();
            
            // Если ffprobe завершился успешно (код 0), значит файл корректный
            return process.ExitCode == 0;
        }
        catch (Exception)
        {
            // Если возникла ошибка при запуске ffprobe (например, не установлен), пропускаем проверку
            return true;
        }
    }
}