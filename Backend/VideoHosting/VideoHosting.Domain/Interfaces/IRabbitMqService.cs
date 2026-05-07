namespace VideoHosting.Domain.Interfaces;

public interface IRabbitMqService
{
    Task PublishVideoProcessingMessageAsync(Guid videoId, string videoFilePath);
}