const WebSocket = require('ws');

class NoisemeterService {
  constructor() {
    this.rooms = new Map();
  }

  generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  setupWebSocket(server) {
    const wss = new WebSocket.Server({ server, path: '/ws/noisemeter' });

    wss.on('connection', (ws, req) => {
      const url = new URL(req.url, 'http://localhost');
      const role = url.searchParams.get('role');
      const code = url.searchParams.get('code');

      if (role === 'display') {
        this.handleDisplay(ws);
      } else if (role === 'sender' && code) {
        this.handleSender(ws, code);
      } else {
        ws.close();
      }
    });

    console.log('📡 WebSocket: /ws/noisemeter');
  }

  handleDisplay(ws) {
    const code = this.generateCode();
    this.rooms.set(code, { display: ws, sender: null });
    ws.roomCode = code;

    ws.send(JSON.stringify({
      type: 'room_created',
      code,
      codeExpiresAt: Date.now() + 300000
    }));

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      const room = this.rooms.get(ws.roomCode);
      if (!room) return;

      if (msg.type === 'refresh_code' || msg.type === 'reset_session') {
        const newCode = this.generateCode();
        this.rooms.delete(ws.roomCode);
        this.rooms.set(newCode, room);
        ws.roomCode = newCode;

        if (room.sender) {
          room.sender.close();
          room.sender = null;
        }

        ws.send(JSON.stringify({
          type: msg.type === 'refresh_code' ? 'code_refreshed' : 'session_reset',
          code: newCode,
          codeExpiresAt: Date.now() + 300000
        }));
      }
    });

    ws.on('close', () => {
      this.rooms.delete(ws.roomCode);
    });
  }

  handleSender(ws, code) {
    const room = this.rooms.get(code);
    if (!room || room.sender) {
      ws.close();
      return;
    }

    room.sender = ws;
    ws.send(JSON.stringify({ type: 'connected' }));
    room.display.send(JSON.stringify({ type: 'sender_connected' }));

    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      if (msg.type === 'noise_level' && room.display.readyState === 1) {
        room.display.send(JSON.stringify({
          type: 'noise_level',
          level: msg.level,
          raw: msg.raw
        }));
      }
    });

    ws.on('close', () => {
      room.sender = null;
      if (room.display.readyState === 1) {
        room.display.send(JSON.stringify({ type: 'sender_disconnected' }));
      }
    });
  }
}

module.exports = new NoisemeterService();
