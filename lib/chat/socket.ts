'use client';

import { io, Socket } from 'socket.io-client';
import { getRuntimeApiBase } from '../api/config';

export interface ChatMessage {
  id?: string;
  complaint_id: string;
  message: string;
  sender_id?: string;
  sender_name?: string;
  sender_role?: string;
  created_at?: string;
  createdAt?: string;
}

/**
 * Derive Socket.IO server URL from the API base.
 */
function getSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (explicit) {
    const trimmed = explicit.trim().replace(/\/$/, '');
    try {
      // If the user provided a full URL, normalize to origin.
      const parsed = new URL(trimmed);
      return parsed.origin;
    } catch {
      // If it's not a valid absolute URL, fall back to using it as-is.
      return trimmed;
    }
  }

  const apiBase = getRuntimeApiBase();
  const url = new URL(apiBase);

  // Optional override if your socket server runs on a different port.
  const portOverride = process.env.NEXT_PUBLIC_SOCKET_PORT;
  if (portOverride && String(portOverride).trim()) {
    url.port = String(portOverride).trim();
  }

  // IMPORTANT: do not guess ports here; default to the API origin.
  return url.origin;
}

function getSocketPath(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_PATH;
  const raw = (explicit || '/socket.io').trim();
  if (!raw) return '/socket.io';

  const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withLeadingSlash;
}

export type SocketTransport = 'websocket' | 'polling';

export interface CreateSocketOptions {
  transports?: SocketTransport[];
  timeoutMs?: number;
  path?: string;
}

function getSocketTransports(): SocketTransport[] {
  const raw = process.env.NEXT_PUBLIC_SOCKET_TRANSPORTS;
  // Backend test client forces WebSocket only; default to that unless overridden.
  if (!raw) return ['websocket'];

  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((t): t is SocketTransport => t === 'polling' || t === 'websocket');

  return parsed.length ? parsed : ['websocket'];
}

/**
 * Create a brand-new Socket.IO connection.
 * The server drops WebSocket after each message, so we don't try to
 * reuse stale connections – each call creates a fresh one if needed.
 */
export function createSocket(
  accessToken: string,
  options: CreateSocketOptions = {},
): Socket {
  const url = getSocketUrl();
  const path = options.path ?? getSocketPath();
  const transports: SocketTransport[] =
    options.transports ?? getSocketTransports();
  const timeout = options.timeoutMs ?? 20000;
  const pollingOnly = transports.length === 1 && transports[0] === 'polling';

  console.log(
    '[Chat] Creating fresh connection to:',
    url,
    'path:',
    path,
    'transports:',
    transports.join(','),
  );

  const socket = io(url, {
    path,
    transports,
    autoConnect: true,
    forceNew: true, // always a brand-new connection
    auth: { accessToken },
    reconnection: false, // we handle reconnection ourselves
    timeout,
    rememberUpgrade: true,
    ...(pollingOnly ? { upgrade: false } : {}),
  });

  socket.on('connect', () => {
    const transport = socket.io?.engine?.transport?.name;
    console.log('[Chat] Connected:', socket.id, '| transport:', transport);

    socket.io?.engine?.on('upgrade', (t: any) => {
      console.log('[Chat] Transport upgraded to:', t?.name);
    });
  });

  socket.on('connect_error', (err) => {
    console.error('[Chat] Connection error:', err.message, '| URL:', url);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Chat] Disconnected:', reason);
  });

  return socket;
}

/**
 * Send a chat message on the given work-order / complaint.
 */
export function sendMessage(
  socket: Socket,
  payload: { complaint_id: string; message: string },
) {
  console.log('[Chat] Emitting send_message | connected:', socket.connected, '| id:', socket.id, '| payload:', JSON.stringify(payload));
  socket.emit('send_message', payload);
}

/**
 * Subscribe to incoming messages.
 * Returns an unsubscribe function.
 */
export function onNewMessage(
  socket: Socket,
  callback: (data: ChatMessage) => void,
): () => void {
  socket.on('new_message', callback);
  return () => {
    socket.off('new_message', callback);
  };
}
