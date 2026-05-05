# План разработки backend проекта для видеохостинга

## 1. Обзор проекта

Backend часть представляет собой API для видеоплатформы с функционалом, аналогичным YouTube. Проект реализован на ASP.NET Core Web API с использованием Clean Architecture.

### Основные технологии:
- ASP.NET Core Web API (C#)
- PostgreSQL (основная база данных)
- MinIO (S3-совместимое хранилище) для видео и миниатюр
- RabbitMQ (брокер сообщений)
- BackgroundService (Worker) для обработки видео

## 2. Архитектура системы

### 2.1. Общая архитектура
- Чистая архитектура (Clean Architecture)
- Разделение на слои:
  * API (Controllers)
  * Application (бизнес-логика, CQRS опционально)
  * Domain (сущности)
  * Infrastructure (БД, S3, RabbitMQ)
- Использование Dependency Injection
- DTO + AutoMapper
- Валидация (FluentValidation)

### 2.2. Микросервисная архитектура
- Основной API сервис
- Worker сервис для обработки видео
- Общение между сервисами через RabbitMQ

## 3. Структура проекта

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

## 4. База данных

### 4.1. Структура базы данных

#### Таблица Users
```sql
CREATE TABLE Users (
    Id UUID PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash TEXT NOT NULL,
    AvatarUrl TEXT,
    Description TEXT,
    IsAdmin BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Таблица Videos
```sql
CREATE TABLE Videos (
    Id UUID PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    ThumbnailUrl TEXT,
    OriginalVideoUrl TEXT,
    HlsUrl TEXT,
    Duration INTEGER, -- в секундах
    Views INTEGER DEFAULT 0,
    Likes INTEGER DEFAULT 0,
    Dislikes INTEGER DEFAULT 0,
    Status VARCHAR(20) DEFAULT 'Processing', -- Processing, Ready, Failed
    UserId UUID REFERENCES Users(Id),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Таблица Comments
```sql
CREATE TABLE Comments (
    Id UUID PRIMARY KEY,
    Text TEXT NOT NULL,
    Likes INTEGER DEFAULT 0,
    UserId UUID REFERENCES Users(Id),
    VideoId UUID REFERENCES Videos(Id),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Таблица Subscriptions
```sql
CREATE TABLE Subscriptions (
    Id UUID PRIMARY KEY,
    SubscriberId UUID REFERENCES Users(Id),
    ChannelId UUID REFERENCES Users(Id),
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(SubscriberId, ChannelId)
);
```

#### Таблица VideoReactions
```sql
CREATE TABLE VideoReactions (
    Id UUID PRIMARY KEY,
    UserId UUID REFERENCES Users(Id),
    VideoId UUID REFERENCES Videos(Id),
    ReactionType VARCHAR(10), -- Like, Dislike
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UNIQUE(UserId, VideoId)
);
```

### 4.2. Индексы

```sql
-- Для ускорения поиска видео
CREATE INDEX idx_videos_user_id ON Videos(UserId);
CREATE INDEX idx_videos_created_at ON Videos(CreatedAt DESC);
CREATE INDEX idx_videos_title ON Videos(Title);

-- Для комментариев
CREATE INDEX idx_comments_video_id ON Comments(VideoId);
CREATE INDEX idx_comments_created_at ON Comments(CreatedAt DESC);

-- Для подписок
CREATE INDEX idx_subscriptions_channel_id ON Subscriptions(ChannelId);
CREATE INDEX idx_subscriptions_subscriber_id ON Subscriptions(SubscriberId);

-- Для реакций
CREATE INDEX idx_video_reactions_video_id ON VideoReactions(VideoId);
CREATE INDEX idx_video_reactions_user_id ON VideoReactions(UserId);
```

## 5. Основные функции API

### 5.1. Аутентификация и пользователи

#### POST `/api/auth/register`
Регистрация нового пользователя
- Валидация данных
- Хеширование пароля
- Создание JWT токена
- Сохранение пользователя в БД

#### POST `/api/auth/login`
Авторизация пользователя
- Проверка email и пароля
- Создание JWT токена

#### GET `/api/auth/me`
Получение информации о текущем пользователе
- Аутентификация по JWT
- Возврат данных пользователя

#### PUT `/api/users/profile`
Обновление профиля пользователя
- Аутентификация по JWT
- Обновление данных профиля
- Сохранение в БД

### 5.2. Видео

#### POST `/api/videos/upload`
Загрузка нового видео
- Аутентификация по JWT
- Загрузка видео файла в MinIO
- Загрузка миниатюры (опционально)
- Сохранение метаданных в БД
- Публикация события в RabbitMQ для обработки

#### GET `/api/videos`
Получение списка видео с фильтрацией и пагинацией
- Поддержка сортировки
- Поддержка поиска по названию
- Пагинация результатов

#### GET `/api/videos/{videoId}`
Получение информации о конкретном видео
- Возврат полной информации о видео
- Включая информацию об авторе

#### PUT `/api/videos/{videoId}`
Обновление информации о видео
- Аутентификация по JWT
- Проверка прав доступа
- Обновление метаданных

#### DELETE `/api/videos/{videoId}`
Удаление видео
- Аутентификация по JWT
- Проверка прав доступа
- Удаление видео из БД и хранилища

#### POST `/api/videos/{videoId}/like`
Лайк видео
- Аутентификация по JWT
- Проверка существующей реакции
- Обновление счетчиков лайков/дизлайков

#### POST `/api/videos/{videoId}/dislike`
Дизлайк видео
- Аутентификация по JWT
- Проверка существующей реакции
- Обновление счетчиков лайков/дизлайков

#### POST `/api/videos/{videoId}/view`
Увеличение счетчика просмотров
- Увеличение счетчика просмотров
- Возможно без аутентификации

#### GET `/api/videos/{videoId}/processing-status`
Получение статуса обработки видео
- Возврат текущего статуса обработки
- Прогресс обработки (если применимо)

### 5.3. Комментарии

#### POST `/api/videos/{videoId}/comments`
Добавление комментария
- Аутентификация по JWT
- Создание комментария
- Сохранение в БД

#### GET `/api/videos/{videoId}/comments`
Получение комментариев к видео
- Пагинация результатов
- Сортировка по дате

#### POST `/api/comments/{commentId}/like`
Лайк комментария
- Аутентификация по JWT
- Увеличение счетчика лайков

### 5.4. Каналы

#### GET `/api/channels/{channelId}`
Получение информации о канале
- Возврат информации о пользователе как о канале
- Количество подписчиков
- Количество видео

#### GET `/api/channels/{channelId}/videos`
Получение видео канала
- Фильтрация видео по каналу
- Пагинация результатов

#### PUT `/api/channels/me`
Обновление информации о своем канале
- Аутентификация по JWT
- Обновление данных канала

### 5.5. Подписки

#### POST `/api/channels/{channelId}/subscribe`
Подписка на канал
- Аутентификация по JWT
- Создание записи о подписке
- Увеличение счетчика подписчиков

#### POST `/api/channels/{channelId}/unsubscribe`
Отписка от канала
- Аутентификация по JWT
- Удаление записи о подписке
- Уменьшение счетчика подписчиков

#### GET `/api/users/me/subscriptions`
Получение списка подписок текущего пользователя
- Аутентификация по JWT
- Возврат списка каналов, на которые подписан пользователь

### 5.6. Администрирование

#### GET `/api/admin/users`
Получение списка пользователей (только для администраторов)
- Аутентификация по JWT
- Проверка прав администратора
- Пагинация результатов
- Поиск по имени/email

#### DELETE `/api/admin/videos/{videoId}`
Удаление видео пользователем (только для администраторов)
- Аутентификация по JWT
- Проверка прав администратора
- Удаление видео с указанием причины

## 6. Обработка видео (HLS стриминг)

### 6.1. Общие положения
HLS (HTTP Live Streaming) - протокол потоковой передачи медиафайлов через HTTP, разработанный Apple. Он поддерживает адаптивный битрейт, позволяя клиенту автоматически выбирать качество видео в зависимости от пропускной способности сети.

### 6.2. Процесс обработки видео

#### Этап 1: Прием видеофайла
1. Получение события из очереди RabbitMQ
2. Валидация видеофайла (формат, кодеки, размер)
3. Извлечение метаданных (разрешение, продолжительность, битрейт)
4. Генерация уникального идентификатора для HLS плейлистов

#### Этап 2: Транскодирование
Видео преобразуется в несколько разрешений:
- 1080p (1920x1080)
- 720p (1280x720)
- 480p (854x480)
- 360p (640x360)

Технические параметры:
- Кодек видео: H.264 (AVC)
- Кодек аудио: AAC
- Частота кадров: 30 FPS (при необходимости понижается)
- Время сегмента: 10 секунд
- Битрейт:
  - 1080p: 5000 kbps
  - 720p: 2800 kbps
  - 480p: 1400 kbps
  - 360p: 800 kbps

#### Этап 3: Сегментация
Каждое транскодированное видео разбивается на сегменты:
- Формат сегментов: MPEG-TS (.ts)
- Длительность сегмента: 10 секунд
- Имя файла сегмента: `{video_id}_{resolution}_{segment_index}.ts`

#### Этап 4: Генерация плейлистов

##### Мастер плейлист (master.m3u8)
Содержит ссылки на все доступные варианты качества:
```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42e01e,mp4a.40.2"
stream_360p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480,CODECS="avc1.42e01e,mp4a.40.2"
stream_480p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,CODECS="avc1.42e01e,mp4a.40.2"
stream_720p.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,CODECS="avc1.42e01e,mp4a.40.2"
stream_1080p.m3u8
```

##### Вариантные плейлисты (stream_{resolution}.m3u8)
Для каждого разрешения создается отдельный плейлист:
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

#EXTINF:10.0,
{video_id}_{resolution}_00001.ts
#EXTINF:10.0,
{video_id}_{resolution}_00002.ts
#EXTINF:10.0,
{video_id}_{resolution}_00003.ts

#EXT-X-ENDLIST
```

### 6.3. Структура хранения файлов
```
/video_storage/
├── {video_id}/
│   ├── master.m3u8              # Мастер плейлист
│   ├── stream_360p.m3u8         # Плейлист 360p
│   ├── stream_480p.m3u8         # Плейлист 480p
│   ├── stream_720p.m3u8         # Плейлист 720p
│   ├── stream_1080p.m3u8        # Плейлист 1080p
│   ├── {video_id}_360p_00001.ts # Сегмент 360p #1
│   ├── {video_id}_360p_00002.ts # Сегмент 360p #2
│   └── ...                      # Остальные сегменты
└── ...
```

### 6.4. Worker сервис обработки видео
- Подписка на очередь RabbitMQ (video-processing)
- Получение сообщений с videoId и путем к файлу
- Обработка видео согласно спецификации HLS
- Обновление статуса видео в БД:
  - Processing
  - Ready
  - Failed

## 7. Интеграция с внешними сервисами

### 7.1. MinIO (S3-совместимое хранилище)
Хранение:
- Исходных видео файлов
- Обработанных видео файлов (HLS сегменты и плейлисты)
- Миниатюр (thumbnails)

Генерация:
- Публичных URL для доступа к файлам
- Presigned URL для загрузки файлов

### 7.2. RabbitMQ (брокер сообщений)
Очередь: video-processing
Сообщение содержит:
- videoId
- путь к файлу

Worker обрабатывает сообщения и обновляет статус видео в БД.

## 8. Безопасность

### 8.1. Аутентификация
- JWT токены для аутентификации пользователей
- Хеширование паролей с использованием bcrypt или аналога
- Защита от brute-force атак

### 8.2. Авторизация
- Проверка прав доступа к ресурсам
- Разделение прав обычных пользователей и администраторов
- Защита эндпоинтов админ-панели

### 8.3. Защита HLS контента
- Подпись URL сегментов для предотвращения хотлинкинга
- Ограничение количества одновременных потоков на пользователя
- Защита от DDoS атак на эндпоинты стриминга

## 9. Масштабирование и производительность

### 9.1. Горизонтальное масштабирование
- Возможность запуска нескольких экземпляров Worker сервиса
- Распределение задач обработки видео между несколькими worker'ами

### 9.2. Кэширование
- Кэширование мастер плейлистов на 1 минуту
- Кэширование вариантных плейлистов на 5 минут
- Использование ETag для проверки изменений
- Кэширование часто запрашиваемых данных (популярные видео, каналы)

### 9.3. Очередь задач
- Использование RabbitMQ для управления очередью обработки видео
- Приоритезация задач обработки
- Мониторинг длины очереди

## 10. Мониторинг и логирование

### 10.1. Логирование
- Логирование всех ошибок транскодирования
- Логирование действий пользователей (по необходимости)
- Логирование ошибок API

### 10.3. Алерты
- Уведомления о сбоях в обработке видео
- Уведомления о высокой нагрузке
- Уведомления о проблемах с внешними сервисами

## 11. Документация и тестирование

### 11.1. Swagger документация
- Автоматическая генерация документации API
- Возможность тестирования эндпоинтов через Swagger UI
- Описание всех параметров и моделей данных

### 11.2. Тестирование
- Unit тесты для бизнес-логики
- Integration тесты для API эндпоинтов
- Тесты для Worker сервиса

## 12. Развертывание

### 12.1. Docker
- Dockerfile для основного API сервиса
- Dockerfile для Worker сервиса
- Docker Compose для локальной разработки и тестирования

### 12.2. Docker Compose
Включает:
- PostgreSQL
- MinIO
- RabbitMQ
- API сервис
- Worker сервис

### 12.3. Конфигурация
- Использование переменных окружения для конфигурации
- Безопасное хранение секретов

## 13. Требования к коду

### 13.1. Качество кода
- Чистый, расширяемый и production-ready код
- Разделение ответственности между компонентами
- Использование async/await для асинхронных операций
- Следование best practices ASP.NET

### 13.2. Соглашения о кодировании
- Единый стиль кодирования
- Использование meaningful имен для переменных и методов
- Комментирование сложной логики
- Соблюдение принципов SOLID

## 14. План реализации

### Этап 1: Подготовка инфраструктуры (Выполнено)
- Настройка проектной структуры
- Конфигурация Docker Compose
- Настройка базы данных
- Настройка MinIO
- Настройка RabbitMQ

### Этап 2: Реализация базовых функций
- Аутентификация и пользователи
- Базовая структура API
- Валидация данных
- Обработка ошибок

### Этап 3: Реализация функций видео
- Загрузка видео
- Очередь обработки видео
- Worker сервис обработки
- Базовые операции с видео

### Этап 4: Реализация дополнительных функций
- Комментарии
- Лайки/дизлайки
- Подписки
- Каналы

### Этап 5: Административные функции
- Админ-панель
- Модерация контента
- Управление пользователями

### Этап 6: HLS стриминг
- Реализация транскодирования
- Генерация плейлистов
- Обработка ошибок
- Интеграция с MinIO

### Этап 7: Тестирование и оптимизация
- Написание тестов
- Оптимизация производительности
- Настройка кэширования
- Мониторинг и логирование

### Этап 8: Документация и финальные штрихи
- Swagger документация
- Техническая документация
- Подготовка к развертыванию
- Финальное тестирование