import type { IncomingMessage } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { verifyAccessToken } from '../utils/jwt.util';
import type { JWTPayload } from '../types';

const connections = new Map<string, Set<WebSocket>>();

export const attachWebSocketServer = (server: import('http').Server) => {
  const webSocketServer = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    if (!request.url?.startsWith('/ws')) {
      socket.destroy();
      return;
    }

    const user = authenticateSocket(request);
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    webSocketServer.handleUpgrade(request, socket, head, (client) => {
      webSocketServer.emit('connection', client, request, user);
    });
  });

  webSocketServer.on('connection', (client: WebSocket, _request: IncomingMessage, user: JWTPayload) => {
    const userConnections = connections.get(user.userId) || new Set<WebSocket>();
    userConnections.add(client);
    connections.set(user.userId, userConnections);

    client.send(JSON.stringify({ type: 'connected' }));
    client.on('close', () => {
      userConnections.delete(client);
      if (userConnections.size === 0) connections.delete(user.userId);
    });
  });

  return webSocketServer;
};

export const broadcastNotification = (userId: string, notification: unknown) => {
  const payload = JSON.stringify({ type: 'notification.created', data: notification });
  for (const client of connections.get(userId) || []) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
};

const authenticateSocket = (request: IncomingMessage): JWTPayload | null => {
  try {
    const url = new URL(request.url || '/', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return null;
    return verifyAccessToken(token) as JWTPayload;
  } catch {
    return null;
  }
};