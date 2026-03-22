// Загрузка переменных окружения из .env файла
require('dotenv').config();

const express = require('express');
const http = require('http');
const NoisemeterService = require('./services/noisemeter.service');
const cors = require('cors');
const path = require('path');

// Импорт сервисов
const DatabaseService = require('./services/database.service');

// Импорт маршрутов
const cardRoutes = require('./routes/card.routes');
const metadataRoutes = require('./routes/metadata.routes');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware - упрощенная CORS конфигурация для отладки
app.use(cors({
  origin: true, // Разрешить все домены для отладки
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Дополнительные CORS заголовки
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json());

// Асинхронная инициализация сервера
async function startServer() {
  try {
    // Инициализация базы данных
    await DatabaseService.initialize();
    
    // Тестовый endpoint для проверки работоспособности
    app.get('/test', (req, res) => {
      res.json({ 
        status: 'OK',
        message: 'EvrikaEdu Backend работает!',
        timestamp: new Date().toISOString()
      });
    });
    
    // Маршруты
    app.use('/api/cards', cardRoutes);
    app.use('/api/metadata', metadataRoutes);
    
    // Базовый маршрут
    app.get('/', (req, res) => {
      res.json({ 
        message: 'EvrikaEdu Backend API', 
        version: '1.0.0',
        endpoints: {
          cards: '/api/cards',
          metadata: '/api/metadata'
        }
      });
    });
    
    // Запуск сервера
    const server = http.createServer(app); NoisemeterService.setupWebSocket(server); server.listen(PORT, () => {
      console.log(`🚀 EvrikaEdu Backend запущен на порту ${PORT}`);
      console.log(`📊 API доступен по адресу: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error.message);
    process.exit(1);
  }
}

// Обработка неперехваченных исключений
process.on('uncaughtException', (error) => {
  console.error('❌ Неперехваченное исключение:', error);
  console.error('Stack trace:', error.stack);
  // Не завершаем процесс сразу, даем время для логирования
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Обработка неперехваченных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Неперехваченное отклонение промиса:', reason);
  console.error('Promise:', promise);
  // Не завершаем процесс для отклонений промисов
});

// Обработка сигналов завершения
process.on('SIGTERM', () => {
  console.log('🛑 Получен сигнал SIGTERM, завершение сервера...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Получен сигнал SIGINT, завершение сервера...');
  process.exit(0);
});

// Запускаем сервер
startServer();

module.exports = app;
