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
      
      console.log(`📱 WebSocket connection: role=${role}, code=${code || 'none'}`);

      if (role === 'display') {
        this.handleDisplay(ws);
      } else if (role === 'sender' && code) {
        this.handleSender(ws, code);
      } else {
        console.log('❌ WebSocket: invalid role or missing code');
        ws.close();
      }
    });

    wss.on('error', (error) => {
      console.error('❌ WebSocket Server Error:', error);
    });

    console.log('📡 WebSocket server initialized: /ws/noisemeter');
  }

  handleDisplay(ws) {
    const code = this.generateCode();
    this.rooms.set(code, { display: ws, sender: null });
    ws.roomCode = code;
    
    console.log(`🖥️  Display connected: room code ${code}`);

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
      console.log(`🖥️  Display disconnected: room code ${ws.roomCode}`);
      this.rooms.delete(ws.roomCode);
    });
  }

  handleSender(ws, code) {
    const room = this.rooms.get(code);
    if (!room || room.sender) {
      console.log(`❌ Sender rejected: room ${code} ${!room ? 'not found' : 'already has sender'}`);
      ws.close();
      return;
    }

    room.sender = ws;
    console.log(`📱 Sender connected to room ${code}`);
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
      console.log(`📱 Sender disconnected from room ${code}`);
      room.sender = null;
      if (room.display.readyState === 1) {
        room.display.send(JSON.stringify({ type: 'sender_disconnected' }));
      }
    });
  }
}

module.exports = new NoisemeterService();
