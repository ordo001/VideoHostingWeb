# ZTube - Премиальная видеоплатформа

ZTube - это премиальная видеоплатформа для профессионалов, созданная как цифровой архив кино и место для кураторского контента.

![ZTube Preview](docs/ztube-preview.png)

## О проекте

ZTube - это не очередной YouTube. Это закрытая, элитарная платформа для профессиональных видео-архивов, документалистики, кинематографических портфолио и коммерческих проектов.

### Особенности
- Премиальный UI/UX дизайн в стиле "digital film archive"
- Поддержка HLS стриминга
- Темная тема с синими акцентами
- Адаптивный дизайн для всех устройств
- Полный функционал видеоплатформы

## Технологии

### Фронтенд
- React.js (v18+)
- React Router v6
- Redux Toolkit
- TailwindCSS
- Axios
- React Hook Form
- React Query (TanStack Query)
- Framer Motion
- HLS.js

### Бэкенд
- ASP.NET Core (.NET 7)
- Entity Framework Core
- PostgreSQL
- MinIO (для хранения видео файлов)
- RabbitMQ (для обработки сообщений)
- AutoMapper
- FluentValidation
- Swagger/OpenAPI

### Инфраструктура
- Docker
- Docker Compose
- Nginx (Reverse Proxy)

## Архитектура

Проект состоит из нескольких микросервисов:

```
┌─────────────────┐    ┌──────────────────┐
│   Клиенты       │    │   Nginx Proxy    │
│  (Браузеры,     │◄──►│   (Reverse       │
│   Мобильные     │    │   Proxy)         │
│   Приложения)   │    │                  │
└─────────────────┘    └──────────────────┘
                                │
               ┌─────────────────────────────────┐
               │         Docker Network          │
               ├─────────────────────────────────┤
               │  ┌────────────┐                 │
               │  │  Frontend  │                 │
               │  │  (React)   │                 │
               │  └────────────┘                 │
               │                                 │
               │  ┌────────────┐                 │
               │  │    API     │                 │
               │  │ (ASP.NET   │                 │
               │  │  Core)     │                 │
               │  └────────────┘                 │
               │                                 │
               │  ┌────────────┐                 │
               │  │   Worker   │                 │
               │  │ (Video     │                 │
               │  │ Processing)│                 │
               │  └────────────┘                 │
               │                                 │
               │  ┌────────────┐                 │
               │  │     DB     │                 │
               │  │ (PostgreSQL)│                │
               │  └────────────┘                 │
               │                                 │
               │  ┌────────────┐                 │
               │  │   MinIO    │                 │
               │  │ (Storage)  │                 │
               │  └────────────┘                 │
               │                                 │
               │  ┌────────────┐                 │
               │  │  RabbitMQ  │                 │
               │  │ (Messaging)│                 │
               │  └────────────┘                 │
               └─────────────────────────────────┘
```

### Компоненты системы

1. **Фронтенд** - React SPA приложение с премиальным дизайном
2. **API** - ASP.NET Core Web API для обработки запросов
3. **Worker** - Сервис для асинхронной обработки видео
4. **PostgreSQL** - Реляционная база данных
5. **MinIO** - Хранилище для видео файлов
6. **RabbitMQ** - Брокер сообщений для обработки задач
7. **Nginx** - Reverse proxy для маршрутизации запросов

## Начало работы

### Быстрый старт с Docker

1. Убедитесь, что Docker и Docker Compose установлены
2. Клонируйте репозиторий:
   ```bash
   git clone <repository-url>
   cd diplom
   ```
3. Запустите все сервисы:
   ```bash
   docker-compose up -d
   ```
4. Откройте браузер и перейдите по адресу: http://localhost

### Локальная разработка

#### Фронтенд
```bash
cd Frontend
npm install
npm run dev
```

#### Бэкенд
```bash
cd Backend/Videohosting
dotnet restore
dotnet run --project VideoHosting.Api
```

## Документация

- [Техническое задание](docs/technical-specification.md)
- [Архитектурная документация](docs/architecture.md)
- [Документация API](docs/api-documentation.yaml)
- [Документация по развертыванию](Frontend/DEPLOYMENT.md)
- [План тестирования](docs/testing-plan.md)
- [Документация UI компонентов](docs/ui-components.md)

## Структура проекта

```
.
├── Backend/
│   └── Videohosting/      # Бэкенд приложение (.NET)
│       ├── VideoHosting.Api/    # Основной API
│       ├── VideoHosting.Worker/ # Worker для обработки видео
│       ├── VideoHosting.Domain/ # Доменные модели
│       ├── VideoHosting.Application/ # Бизнес логика
│       ├── VideoHosting.Infrastructure/ # Инфраструктура
│       └── ...
├── Frontend/              # Фронтенд приложение (React)
│   ├── src/
│   │   ├── components/    # Переиспользуемые компоненты
│   │   ├── pages/         # Страницы приложения
│   │   ├── services/      # Сервисы для работы с API
│   │   ├── store/         # Redux store и слайсы
│   │   └── ...
│   ├── public/            # Статические файлы
│   └── ...
├── docs/                  # Документация
├── docker-compose.yml     # Конфигурация Docker Compose
├── nginx.conf            # Конфигурация Nginx
└── README.md             # Этот файл
```

## Развертывание

Подробная информация о развертывании находится в [DEPLOYMENT.md](Frontend/DEPLOYMENT.md)

### Production развертывание
```bash
docker-compose up -d
```

## Тестирование

### Фронтенд
```bash
cd Frontend
npm test
```

### Бэкенд
```bash
cd Backend/Videohosting
dotnet test
```

## Мониторинг и администрирование

### Доступ к сервисам

После запуска docker-compose, следующие сервисы будут доступны:

- **Фронтенд**: http://localhost
- **API Swagger**: http://localhost:8080/swagger
- **MinIO Console**: http://localhost:9001
- **RabbitMQ Management**: http://localhost:15672
- **PostgreSQL**: localhost:5432

Учетные данные для административных интерфейсов:
- **MinIO**: minioadmin / minioadmin
- **RabbitMQ**: guest / guest
- **PostgreSQL**: postgres / postgres

## Лицензия

Этот проект является проприетарным и не подлежит распространению без письменного разрешения владельца.

## Контакты

Для вопросов и поддержки обращайтесь к владельцу репозитория.