import {
  type ClientMessage,
  GAME_SOCKET_PATH,
  type ServerMessage,
  UNAUTHENTICATED_CLOSE_CODE,
} from '@ragidle/protocol';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'unauthenticated';

interface GameClientHandlers {
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: ConnectionStatus) => void;
}

const MAX_RECONNECT_DELAY_MS = 10_000;

/**
 * Thin WebSocket wrapper. The browser sends the session cookie with the upgrade
 * request and the server replies with the authoritative state; nothing is
 * reconstructed locally. A rejected session stops reconnecting.
 */
export class GameClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  constructor(private readonly handlers: GameClientHandlers) {}

  connect(): void {
    this.closed = false;
    this.handlers.onStatus('connecting');
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${location.host}${GAME_SOCKET_PATH}`);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectAttempts = 0;
      this.handlers.onStatus('connected');
    });
    socket.addEventListener('message', (event) => {
      this.handlers.onMessage(JSON.parse(String(event.data)) as ServerMessage);
    });
    socket.addEventListener('close', (event) => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (event.code === UNAUTHENTICATED_CLOSE_CODE) {
        this.closed = true;
        this.handlers.onStatus('unauthenticated');
        return;
      }
      this.handlers.onStatus('disconnected');
      if (!this.closed) this.scheduleReconnect();
    });
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify(message));
  }

  close(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  private scheduleReconnect(): void {
    const delay = Math.min(MAX_RECONNECT_DELAY_MS, 500 * 2 ** this.reconnectAttempts);
    this.reconnectAttempts += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
