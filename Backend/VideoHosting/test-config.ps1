# Тестовая проверка конфигурации без запуска Docker
Write-Host "Проверка конфигурации Worker сервиса..." -ForegroundColor Yellow

# Проверим наличие необходимых файлов
$workerDir = "VideoHosting.Worker"
$configFiles = @("appsettings.json", "appsettings.Container.json", "appsettings.example.json")

foreach ($file in $configFiles) {
    $path = Join-Path $workerDir $file
    if (Test-Path $path) {
        Write-Host "✓ Найден файл: $path" -ForegroundColor Green
    } else {
        Write-Host "✗ Отсутствует файл: $path" -ForegroundColor Red
    }
}

# Проверим Dockerfile
$dockerfilePath = Join-Path $workerDir "Dockerfile"
if (Test-Path $dockerfilePath) {
    Write-Host "✓ Найден файл: $dockerfilePath" -ForegroundColor Green
} else {
    Write-Host "✗ Отсутствует файл: $dockerfilePath" -ForegroundColor Red
}

Write-Host "`nПроверка конфигурации API сервиса..." -ForegroundColor Yellow

# Проверим наличие необходимых файлов
$apiDir = "VideoHosting.Api"
foreach ($file in $configFiles) {
    $path = Join-Path $apiDir $file
    if (Test-Path $path) {
        Write-Host "✓ Найден файл: $path" -ForegroundColor Green
    } else {
        Write-Host "✗ Отсутствует файл: $path" -ForegroundColor Red
    }
}

# Проверим Dockerfile
$dockerfilePath = Join-Path $apiDir "Dockerfile"
if (Test-Path $dockerfilePath) {
    Write-Host "✓ Найден файл: $dockerfilePath" -ForegroundColor Green
} else {
    Write-Host "✗ Отсутствует файл: $dockerfilePath" -ForegroundColor Red
}

Write-Host "`nПроверка docker-compose.yml..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✓ Найден файл: docker-compose.yml" -ForegroundColor Green
    
    # Прочитаем содержимое файла и проверим наличие ключевых элементов
    $content = Get-Content "docker-compose.yml" -Raw
    
    if ($content -match "RabbitMq__HostName") {
        Write-Host "✓ Найдена конфигурация RabbitMQ в переменных среды" -ForegroundColor Green
    } else {
        Write-Host "✗ Не найдена конфигурация RabbitMQ в переменных среды" -ForegroundColor Red
    }
    
    if ($content -match "videohosting-rabbitmq") {
        Write-Host "✓ Найдена служба RabbitMQ" -ForegroundColor Green
    } else {
        Write-Host "✗ Не найдена служба RabbitMQ" -ForegroundColor Red
    }
    
    if ($content -match "videohosting-worker") {
        Write-Host "✓ Найдена служба Worker" -ForegroundColor Green
    } else {
        Write-Host "✗ Не найдена служба Worker" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Отсутствует файл: docker-compose.yml" -ForegroundColor Red
}

Write-Host "`nАнализ кода Worker сервиса..." -ForegroundColor Yellow

# Проверим VideoProcessingService.cs
$videoProcessingServicePath = Join-Path $workerDir "VideoProcessingService.cs"
if (Test-Path $videoProcessingServicePath) {
    $content = Get-Content $videoProcessingServicePath -Raw
    
    if ($content -match "configuration\.GetValue<string>\(\"RabbitMq:HostName") {
        Write-Host "✓ VideoProcessingService использует IConfiguration для RabbitMQ" -ForegroundColor Green
    } else {
        Write-Host "✗ VideoProcessingService не использует IConfiguration для RabbitMQ" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Отсутствует файл: $videoProcessingServicePath" -ForegroundColor Red
}

Write-Host "`nПроверка завершена!" -ForegroundColor Cyan