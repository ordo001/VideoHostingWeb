# Документация фронтенд части видеоплатформы

## Обзор проекта

Фронтенд часть представляет собой видеоплатформу с функционалом, аналогичным YouTube. Проект реализован на React с использованием TypeScript и современных подходов к разработке.

### Основные функции платформы:

1. **Главная страница** с рекомендациями видео
2. **Страница просмотра видео** с возможностью:
   - Просмотра видео
   - Лайк/дизлайк
   - Комментирование
   - Поделиться видео
3. **Страница канала** пользователя с:
   - Информацией о канале
   - Списком видео пользователя
   - Возможностью подписки
4. **Личный кабинет** с:
   - Редактированием профиля
   - Загрузкой новых видео
5. **Административная панель** с:
   - Управлением пользователями
   - Модерацией контента

## Структура роутинга

```
/                        - Главная страница с рекомендациями
/watch/:videoId          - Страница просмотра видео
/channel/:channelId      - Страница канала пользователя
/channel/edit            - Редактирование канала
/upload                  - Загрузка нового видео
/admin                   - Административная панель
/admin/user/:userId      - Управление видео пользователя (для администраторов)
```

## Необходимые бэкенд эндпоинты

Для полноценного функционирования приложения требуется реализация следующих API эндпоинтов:

### 1. Аутентификация и пользователи

#### POST `/api/auth/register`
Регистрация нового пользователя
```json
// Request
{
  "name": "string",
  "email": "string",
  "password": "string"
}

// Response
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "avatar": "string (optional)",
    "isAdmin": "boolean"
  }
}
```

#### POST `/api/auth/login`
Авторизация пользователя
```json
// Request
{
  "email": "string",
  "password": "string"
}

// Response
{
  "token": "string",
  "user": {
    "id": "string",
    "name": "string",
    "email": "string",
    "avatar": "string (optional)",
    "isAdmin": "boolean"
  }
}
```

#### GET `/api/auth/me`
Получение информации о текущем пользователе
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string (optional)",
  "isAdmin": "boolean"
}
```

#### PUT `/api/users/profile`
Обновление профиля пользователя
```json
// Headers
Authorization: Bearer <token>

// Request
{
  "name": "string",
  "description": "string (optional)"
}

// Response
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string (optional)",
  "description": "string (optional)"
}
```

### 2. Видео

#### POST `/api/videos/upload`
Загрузка нового видео (multipart/form-data)
```json
// Headers
Authorization: Bearer <token>
Content-Type: multipart/form-data

// Form fields
video_file: File
thumbnail_file: File (optional)
title: string
description: string

// Response
{
  "id": "string",
  "title": "string",
  "description": "string",
  "thumbnail_url": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### GET `/api/videos`
Получение списка видео с фильтрацией и пагинацией
```json
// Query params
page: number (default: 1)
limit: number (default: 20)
sort: string (default: "created_at")
order: "asc" | "desc" (default: "desc")
search: string (optional)
author_id: string (optional)

// Response
{
  "videos": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "thumbnail_url": "string",
      "duration": "number", // в секундах
      "views": "number",
      "likes": "number",
      "dislikes": "number",
      "created_at": "datetime",
      "author": {
        "id": "string",
        "name": "string",
        "avatar": "string (optional)"
      }
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### GET `/api/videos/{videoId}`
Получение информации о конкретном видео
```json
// Response
{
  "id": "string",
  "title": "string",
  "description": "string",
  "thumbnail_url": "string",
  "hls_url": "string", // URL для HLS стриминга
  "duration": "number", // в секундах
  "views": "number",
  "likes": "number",
  "dislikes": "number",
  "created_at": "datetime",
  "updated_at": "datetime",
  "author": {
    "id": "string",
    "name": "string",
    "avatar": "string (optional)",
    "subscribers_count": "number"
  }
}
```

#### PUT `/api/videos/{videoId}`
Обновление информации о видео
```json
// Headers
Authorization: Bearer <token>

// Request
{
  "title": "string",
  "description": "string"
}

// Response
{
  "id": "string",
  "title": "string",
  "description": "string",
  "thumbnail_url": "string",
  "hls_url": "string",
  "duration": "number",
  "views": "number",
  "likes": "number",
  "dislikes": "number",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

#### DELETE `/api/videos/{videoId}`
Удаление видео
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "success": true
}
```

#### POST `/api/videos/{videoId}/like`
Лайк видео
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "likes": "number",
  "dislikes": "number"
}
```

#### POST `/api/videos/{videoId}/dislike`
Дизлайк видео
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "likes": "number",
  "dislikes": "number"
}
```

#### POST `/api/videos/{videoId}/view`
Увеличение счетчика просмотров
```json
// Headers
Authorization: Bearer <token> (optional)

// Response
{
  "views": "number"
}
```

### 3. Комментарии

#### POST `/api/videos/{videoId}/comments`
Добавление комментария
```json
// Headers
Authorization: Bearer <token>

// Request
{
  "text": "string"
}

// Response
{
  "id": "string",
  "text": "string",
  "created_at": "datetime",
  "author": {
    "id": "string",
    "name": "string",
    "avatar": "string (optional)"
  }
}
```

#### GET `/api/videos/{videoId}/comments`
Получение комментариев к видео
```json
// Query params
page: number (default: 1)
limit: number (default: 20)

// Response
{
  "comments": [
    {
      "id": "string",
      "text": "string",
      "likes": "number",
      "created_at": "datetime",
      "author": {
        "id": "string",
        "name": "string",
        "avatar": "string (optional)"
      }
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### POST `/api/comments/{commentId}/like`
Лайк комментария
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "likes": "number"
}
```

### 4. Каналы

#### GET `/api/channels/{channelId}`
Получение информации о канале
```json
// Response
{
  "id": "string",
  "name": "string",
  "description": "string",
  "avatar_url": "string",
  "banner_url": "string",
  "subscribers_count": "number",
  "videos_count": "number",
  "created_at": "datetime"
}
```

#### GET `/api/channels/{channelId}/videos`
Получение видео канала
```json
// Query params
page: number (default: 1)
limit: number (default: 20)

// Response
{
  "videos": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "thumbnail_url": "string",
      "duration": "number",
      "views": "number",
      "created_at": "datetime"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### PUT `/api/channels/me`
Обновление информации о своем канале
```json
// Headers
Authorization: Bearer <token>

// Request
{
  "name": "string",
  "description": "string"
}

// Response
{
  "id": "string",
  "name": "string",
  "description": "string",
  "avatar_url": "string",
  "banner_url": "string",
  "subscribers_count": "number",
  "videos_count": "number",
  "created_at": "datetime"
}
```

### 5. Подписки

#### POST `/api/channels/{channelId}/subscribe`
Подписка на канал
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "subscribed": true,
  "subscribers_count": "number"
}
```

#### POST `/api/channels/{channelId}/unsubscribe`
Отписка от канала
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "subscribed": false,
  "subscribers_count": "number"
}
```

#### GET `/api/users/me/subscriptions`
Получение списка подписок текущего пользователя
```json
// Headers
Authorization: Bearer <token>

// Response
{
  "channels": [
    {
      "id": "string",
      "name": "string",
      "avatar_url": "string"
    }
  ]
}
```

### 6. Администрирование

#### GET `/api/admin/users`
Получение списка пользователей (только для администраторов)
```json
// Headers
Authorization: Bearer <token>

// Query params
page: number (default: 1)
limit: number (default: 20)
search: string (optional)

// Response
{
  "users": [
    {
      "id": "string",
      "name": "string",
      "email": "string",
      "videos_count": "number",
      "created_at": "datetime",
      "is_admin": "boolean"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number"
}
```

#### DELETE `/api/admin/videos/{videoId}`
Удаление видео пользователем (только для администраторов)
```json
// Headers
Authorization: Bearer <token>

// Request
{
  "reason": "string"
}

// Response
{
  "success": true
}
```

## Требования к HLS стримингу

Для реализации просмотра видео в разных разрешениях необходимо:

1. При загрузке видео сервер должен автоматически:
   - Конвертировать видео в несколько разрешений (например: 1080p, 720p, 480p, 360p)
   - Создавать HLS плейлисты (.m3u8) для каждого разрешения
   - Хранить сегменты видео (.ts) на файловом хранилище

2. Эндпоинт для получения HLS плейлиста:
   ```
   GET /api/videos/{videoId}/stream.m3u8
   ```

3. Сервер должен генерировать мастер плейлист, содержащий ссылки на все доступные разрешения:
   ```m3u8
   #EXTM3U
   #EXT-X-VERSION:3
   #EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
   stream_360p.m3u8
   #EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=842x480
   stream_480p.m3u8
   #EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
   stream_720p.m3u8
   #EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
   stream_1080p.m3u8
   ```

## Дополнительные требования

1. **JWT токены** для аутентификации
2. **Хранение файлов** - использовать локальное S3 хранилище (Minio)
3. **База данных** - PostgreSQL для хранения метаданных
4. **Конвертация видео** - интеграция с FFmpeg для создания HLS плейлистов
6. **WebSocket** для уведомлений в реальном времени (при необходимости)