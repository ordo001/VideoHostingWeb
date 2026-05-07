using RabbitMQ.Client;
using System.Text;
using VideoHosting.Domain.Interfaces;

namespace VideoHosting.Infrastructure.Messaging;

public class RabbitMqService : IRabbitMqService, IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;

    public RabbitMqService(IConnection connection)
    {
        _connection = connection;
        _channel = _connection.CreateModel();
        
        // Объявление очереди для обработки видео
        _channel.QueueDeclare(queue: "video-processing",
                             durable: true,
                             exclusive: false,
                             autoDelete: false,
                             arguments: null);
    }

    public Task PublishVideoProcessingMessageAsync(Guid videoId, string videoFilePath)
    {
        var message = new VideoProcessingMessage
        {
            VideoId = videoId,
            VideoFilePath = videoFilePath,
            Timestamp = DateTime.UtcNow
        };

        var json = System.Text.Json.JsonSerializer.Serialize(message);
        var body = Encoding.UTF8.GetBytes(json);

        var properties = _channel.CreateBasicProperties();
        properties.Persistent = true;

        _channel.BasicPublish(exchange: "",
                             routingKey: "video-processing",
                             basicProperties: properties,
                             body: body);

        return Task.CompletedTask;
    }

    public void Dispose()
    {
        _channel?.Close();
        _connection?.Close();
    }
}

public class VideoProcessingMessage
{
    public Guid VideoId { get; set; }
    public string VideoFilePath { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}