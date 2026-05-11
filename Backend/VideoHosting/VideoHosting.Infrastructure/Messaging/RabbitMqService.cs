using RabbitMQ.Client;
using System.Text;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Infrastructure.Messaging;

public class RabbitMqService : IRabbitMqService, IDisposable
{
    private readonly IConnection _connection;
    private IModel? _channel;
    private readonly object _channelLock = new object();

    public RabbitMqService(IConnection connection)
    {
        _connection = connection;
    }
    
    private IModel Channel
    {
        get
        {
            if (_channel == null || !_channel.IsOpen)
            {
                lock (_channelLock)
                {
                    if (_channel == null || !_channel.IsOpen)
                    {
                        _channel?.Dispose();
                        _channel = _connection.CreateModel();
                        
                        // Объявление очереди для обработки видео
                        _channel.QueueDeclare(queue: "video-processing",
                                             durable: true,
                                             exclusive: false,
                                             autoDelete: false,
                                             arguments: null);
                    }
                }
            }
            return _channel;
        }
    }

    public Task PublishVideoProcessingMessageAsync(Guid videoId, string videoFilePath)
    {
        try
        {
            var message = new VideoProcessingMessage
            {
                VideoId = videoId,
                VideoFilePath = videoFilePath,
                Timestamp = DateTime.UtcNow
            };

            var json = System.Text.Json.JsonSerializer.Serialize(message);
            var body = Encoding.UTF8.GetBytes(json);

            var properties = Channel.CreateBasicProperties();
            properties.Persistent = true;

            Channel.BasicPublish(exchange: "",
                                 routingKey: "video-processing",
                                 basicProperties: properties,
                                 body: body);

            return Task.CompletedTask;
        }
        catch (Exception ex)
        {
            // Логируем ошибку, но не прерываем выполнение
            throw new InvalidOperationException($"Ошибка публикации сообщения в RabbitMQ: {ex.Message}", ex);
        }
    }

    public void Dispose()
    {
        lock (_channelLock)
        {
            if (_channel != null)
            {
                try
                {
                    if (_channel.IsOpen)
                    {
                        _channel.Close();
                    }
                }
                catch
                {
                    // Игнорируем ошибки закрытия канала
                }
                finally
                {
                    _channel.Dispose();
                    _channel = null;
                }
            }
        }
    }
}

public class VideoProcessingMessage
{
    public Guid VideoId { get; set; }
    public string VideoFilePath { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}