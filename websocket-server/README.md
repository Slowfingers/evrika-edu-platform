# Evrika WebSocket Server

Отдельный WebSocket сервер для функции "Шумометр" (использование телефона как микрофона).

## Зачем нужен отдельный сервер?

Vercel не поддерживает WebSocket в serverless функциях. Поэтому WebSocket сервер нужно развернуть отдельно на платформе, которая поддерживает долгоживущие соединения.

## Развёртывание на Render.com

1. Зайдите на https://render.com
2. Создайте новый **Web Service**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Name**: `evrika-websocket`
   - **Root Directory**: `websocket-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. После деплоя получите URL вида: `https://evrika-websocket.onrender.com`

## Обновление фронтенда

После деплоя обновите URL WebSocket в файле `/frontend/src/routes/noisemeter/+page.svelte`:

```javascript
function getWsUrl() {
  if (!browser) return '';
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  if (!host.includes('localhost')) {
    return `wss://evrika-websocket.onrender.com/ws/noisemeter`; // ← Ваш URL
  }
  return `${proto}://${host}:10000/ws/noisemeter`;
}
```

## Локальная разработка

```bash
cd websocket-server
npm install
npm start
```

WebSocket будет доступен на `ws://localhost:8080/ws/noisemeter`
