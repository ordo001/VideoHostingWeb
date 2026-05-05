# Видеоплатформа - Backend

Backend часть представляет собой API для видеоплатформы с функционалом, аналогичным YouTube.

## Основные технологии:
- ASP.NET Core Web API (C#)
- PostgreSQL (основная база данных)
- MinIO (S3-совместимое хранилище) для видео и миниатюр
- RabbitMQ (брокер сообщений)
- BackgroundService (Worker) для обработки видео

## Структура проекта
```
VideoHosting.Backend/
├── VideoHosting.Api/                # API слой
│   ├── Controllers/                 # Контроллеры API
│   ├── Program.cs                   # Точка входа
│   └── Startup.cs                   # Конфигурация приложения
├── VideoHosting.Application/        # Application слой
│   ├── Commands/                    # Команды CQRS
│   ├── Queries/                     # Запросы CQRS
│   ├── DTOs/                        # Data Transfer Objects
│   └── Services/                    # Сервисы приложения
├── VideoHosting.Domain/             # Domain слой
│   ├── Entities/                    # Сущности домена
│   ├── Interfaces/                  # Интерфейсы репозиториев
│   └── Enums/                       # Перечисления
├── VideoHosting.Infrastructure/     # Infrastructure слой
│   ├── Data/                        # Репозитории и DbContext
│   ├── Services/                    # Реализации внешних сервисов
│   ├── Storage/                     # Работа с MinIO
│   └── Messaging/                   # Работа с RabbitMQ
├── VideoHosting.Worker/             # Worker сервис
│   └── VideoProcessingService.cs    # Обработка видео
└── VideoHosting.Tests/              # Тесты
```

## Запуск проекта

### Требования
- .NET 9.0 SDK
- Docker и Docker Compose

### Запуск с помощью Docker
```bash
# Запуск всей инфраструктуры
docker-compose up -d

# Остановка
docker-compose down
```

### Запуск в режиме разработки
```bash
# Запуск БД, MinIO и RabbitMQ
docker-compose up postgres minio rabbitmq -d

# Запуск API
dotnet run --project Backend/VideoHosting/VideoHosting.Api/VideoHosting.Api.csproj

# Запуск Worker
dotnet run --project Backend/VideoHosting/VideoHosting.Worker/VideoHosting.Worker.csproj
```

### Применение миграций БД
```bash
# Применение миграций
dotnet run --project Backend/VideoHosting/VideoHosting.Api/VideoHosting.Api.csproj -- --migrate
```

## Доступ к сервисам

### После запуска через Docker:
- API: http://localhost:8080
- PostgreSQL: localhost:5432
- MinIO: http://localhost:9000
- MinIO Console: http://localhost:9001
- RabbitMQ: http://localhost:15672

## Конфигурация

Основные настройки находятся в файлах:
- `VideoHosting.Api/appsettings.json`
- `VideoHosting.Api/appsettings.Development.json`
- `VideoHosting.Api/appsettings.Container.json`

## Разработка

### Структура Clean Architecture:
1. **Domain** - Enterprise business rules
2. **Application** - Application business rules  
3. **Infrastructure** - Frameworks and drivers
4. **Api** - Presenters, Views, Controllers

### Создание миграций
```bash
dotnet ef migrations add MigrationName --project Backend/VideoHosting/VideoHosting.Infrastructure/VideoHosting.Infrastructure.csproj --startup-project Backend/VideoHosting/VideoHosting.Api/VideoHosting.Api.csproj
```