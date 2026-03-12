'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, MessageSquare, Check, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChatMessage,
  createSocket,
  sendMessage,
  onNewMessage,
} from '@/lib/chat/socket';
import { fetchChatMessages } from '@/lib/api/chats';
import type { Socket } from 'socket.io-client';

interface WorkOrderChatProps {
  complaintId: string;
  accessToken: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
}

const CONNECT_TIMEOUT_MS = 20000;
const BACKOFF_BASE_MS = 800;
const BACKOFF_MAX_MS = 15000;
const POST_SEND_RECONNECT_DELAY_MS = 3000;
const MESSAGE_CACHE_LIMIT = 200;

function backoffDelayMs(attempt: number): number {
  const exp = Math.min(attempt, 6);
  const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, exp), BACKOFF_MAX_MS);
  const jitter = Math.floor(Math.random() * 250);
  return delay + jitter;
}

function getCacheKey(complaintId: string) {
  return `workorder_chat_cache:${complaintId}`;
}

function loadCachedMessages(complaintId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(getCacheKey(complaintId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function persistMessages(complaintId: string, messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = messages.slice(-MESSAGE_CACHE_LIMIT);
    window.localStorage.setItem(
      getCacheKey(complaintId),
      JSON.stringify(trimmed),
    );
  } catch {
    // ignore quota / serialization errors
  }
}

function toMillis(m: ChatMessage): number {
  const iso = m.created_at || m.createdAt;
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function mergeMessages(
  server: ChatMessage[],
  local: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  const withoutId: ChatMessage[] = [];

  for (const msg of server) {
    if (msg?.id) byId.set(msg.id, msg);
    else withoutId.push(msg);
  }

  for (const msg of local) {
    if (msg?.id) {
      if (!byId.has(msg.id)) byId.set(msg.id, msg);
    } else {
      withoutId.push(msg);
    }
  }

  const merged = [...byId.values(), ...withoutId];
  merged.sort((a, b) => toMillis(a) - toMillis(b));
  return merged;
}

const WorkOrderChat: React.FC<WorkOrderChatProps> = ({
  complaintId,
  accessToken,
  currentUserId,
  currentUserName,
  currentUserRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    loadCachedMessages(complaintId),
  );
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState<
    'connected' | 'reconnecting' | 'disconnected'
  >('disconnected');
  const [lastError, setLastError] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listenSocketRef = useRef<Socket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  const connectPromiseRef = useRef<Promise<Socket> | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectNowRef = useRef<(() => Promise<Socket>) | null>(null);
  const historyLoadSeqRef = useRef(0);
  // Flag: suppress error display for the expected disconnect right after send_message
  const justSentRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Rehydrate cache when switching to a different complaint/work order
  useEffect(() => {
    setMessages(loadCachedMessages(complaintId));
    setDraft('');
    setLastError('');

    // Reset connection heuristics when switching rooms
    reconnectAttemptRef.current = 0;
  }, [complaintId]);

  // Fetch persisted chat history from backend (cross-browser/device)
  useEffect(() => {
    if (!complaintId || !accessToken) return;

    const seq = ++historyLoadSeqRef.current;
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchChatMessages({
          token: accessToken,
          complaintId,
        });

        if (cancelled) return;
        if (seq !== historyLoadSeqRef.current) return;

        const serverMessages = (data.messages ||
          []) as unknown as ChatMessage[];

        // If the server returned an empty array, treat it as the source of
        // truth — don't keep showing stale browser-cached messages.
        if (serverMessages.length === 0) {
          setMessages([]);
          persistMessages(complaintId, []);
        } else {
          setMessages((prev) => mergeMessages(serverMessages, prev));
        }
      } catch (e: any) {
        if (cancelled) return;
        const msg =
          typeof e?.message === 'string'
            ? e.message
            : 'Failed to load messages';
        setLastError(msg);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [complaintId, accessToken]);

  // Reset connection heuristics when auth changes
  useEffect(() => {
    reconnectAttemptRef.current = 0;
  }, [accessToken]);

  // Persist messages (debounced) so leaving/returning doesn't wipe the chat UI
  useEffect(() => {
    if (!complaintId) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      persistMessages(complaintId, messages);
    }, 250);

    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [complaintId, messages]);

  const cleanupSocket = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (listenSocketRef.current) {
      listenSocketRef.current.removeAllListeners();
      listenSocketRef.current.disconnect();
      listenSocketRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback((delayOverrideMs?: number) => {
    if (!mountedRef.current) return;
    if (connectPromiseRef.current) return;
    if (reconnectTimer.current) return;

    setStatus('reconnecting');
    const delay =
      delayOverrideMs ?? backoffDelayMs(reconnectAttemptRef.current++);
    console.log(
      `[Chat] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptRef.current})`,
    );
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      const connectNow = connectNowRef.current;
      if (!connectNow) return;

      void connectNow().catch(() => {
        // If connectFresh rejects, schedule another attempt
        scheduleReconnect();
      });
    }, delay);
  }, []);

  const attachMessageListener = useCallback(
    (socket: Socket) => {
      // Debug: log all incoming/outgoing events while connected.
      try {
        (socket as any).onAny?.((event: string, ...args: any[]) => {
          console.log('[Chat] <-', event, ...args);
        });
        (socket as any).onAnyOutgoing?.((event: string, ...args: any[]) => {
          console.log('[Chat] ->', event, ...args);
        });
      } catch {
        // ignore
      }

      onNewMessage(socket, (msg) => {
        if (!mountedRef.current) return;
        console.log('[Chat] new_message payload:', msg);
        if (msg.complaint_id !== complaintId) return;

        setMessages((prev) => {
          if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      });
    },
    [complaintId],
  );

  const waitForConnect = useCallback((socket: Socket, timeoutMs: number) => {
    return new Promise<void>((resolve, reject) => {
      if (socket.connected) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        socket.off('connect', onConnect);
        reject(new Error('connect_timeout'));
      }, timeoutMs);

      const onConnect = () => {
        clearTimeout(timer);
        resolve();
      };

      socket.once('connect', onConnect);
    });
  }, []);

  const connectFresh = useCallback(async (): Promise<Socket> => {
    if (!accessToken || !complaintId) throw new Error('missing_credentials');
    if (!mountedRef.current) throw new Error('unmounted');

    if (connectPromiseRef.current) return connectPromiseRef.current;

    connectPromiseRef.current = (async () => {
      cleanupSocket();
      setStatus('reconnecting');
      setLastError('');

      const socket = createSocket(accessToken, {
        timeoutMs: CONNECT_TIMEOUT_MS,
      });
      listenSocketRef.current = socket;

      const onConnected = () => {
        if (!mountedRef.current) return;
        reconnectAttemptRef.current = 0;
        setStatus('connected');
      };

      socket.on('connect', onConnected);
      socket.on('disconnect', (reason: any) => {
        if (!mountedRef.current) return;

        // The server closes the transport right after send_message.
        // This is expected — don't show it as an error; use a longer
        // delay so the server has time to accept a new connection.
        if (justSentRef.current) {
          justSentRef.current = false;
          console.log(
            '[Chat] Expected post-send disconnect, reconnecting quietly…',
          );
          scheduleReconnect(POST_SEND_RECONNECT_DELAY_MS);
          return;
        }

        const transport = socket.io?.engine?.transport?.name;
        const reasonText = typeof reason === 'string' ? reason : 'disconnect';
        setLastError(`Disconnected (${transport || 'unknown'}): ${reasonText}`);
        scheduleReconnect();
      });
      // Don't surface connect_error as a visible error — the backoff
      // retry loop handles it. Showing it just confuses users.
      socket.on('connect_error', (err: any) => {
        if (!mountedRef.current) return;
        console.warn('[Chat] connect_error:', err?.message);
      });

      attachMessageListener(socket);
      await waitForConnect(socket, CONNECT_TIMEOUT_MS);
      onConnected();
      return socket;
    })();

    try {
      return await connectPromiseRef.current;
    } finally {
      connectPromiseRef.current = null;
    }
  }, [
    accessToken,
    complaintId,
    attachMessageListener,
    cleanupSocket,
    scheduleReconnect,
    waitForConnect,
  ]);

  // Keep a ref to the latest connect function so the reconnect scheduler
  // always uses current complaintId/accessToken without dependency cycles.
  connectNowRef.current = connectFresh;

  // Reuse existing socket if it's still connected; only create fresh if needed.
  const ensureConnected = useCallback(async (): Promise<Socket> => {
    const existing = listenSocketRef.current;
    if (existing?.connected) return existing;
    return connectFresh();
  }, [connectFresh]);

  // Connect on mount, cleanup on unmount.
  // A small delay prevents the "WebSocket closed before connection established"
  // error caused by React strict-mode double-mounting in development: the
  // first mount is unmounted instantly, so the cleanup clears the timer
  // before any real WebSocket is opened.
  useEffect(() => {
    mountedRef.current = true;

    const delayTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      void connectFresh().catch((err) => {
        if (!mountedRef.current) return;
        setLastError(err instanceof Error ? err.message : 'connect_failed');
        scheduleReconnect();
      });
    }, 50);

    return () => {
      mountedRef.current = false;
      clearTimeout(delayTimer);
      cleanupSocket();
    };
  }, [cleanupSocket, connectFresh, scheduleReconnect]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !accessToken) return;

    // Optimistically show the message immediately
    const optimistic: ChatMessage = {
      complaint_id: complaintId,
      message: text,
      sender_id: currentUserId,
      sender_name: currentUserName,
      sender_role: currentUserRole,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');
    inputRef.current?.focus();

    try {
      const socket = await ensureConnected();

      // Mark that we're about to send — the server will disconnect us
      // right after, and we don't want to show that as an error.
      justSentRef.current = true;

      // Fire-and-forget: the server closes the connection before any ACK
      // can arrive, so don't wait for one.
      sendMessage(socket, { complaint_id: complaintId, message: text });
      console.log('[Chat] send_message emitted (fire-and-forget)');

      // After reconnect settles, refresh history to confirm delivery
      setTimeout(() => {
        (async () => {
          try {
            const data = await fetchChatMessages({
              token: accessToken,
              complaintId,
            });
            const serverMessages = (data.messages ||
              []) as unknown as ChatMessage[];
            setMessages((prev) => mergeMessages(serverMessages, prev));
          } catch (e: any) {
            const msg =
              typeof e?.message === 'string'
                ? e.message
                : 'Failed to refresh history';
            console.error('[Chat] History refresh failed:', msg);
          }
        })();
      }, 1500);
    } catch (e: any) {
      justSentRef.current = false;
      const msg = typeof e?.message === 'string' ? e.message : 'send_failed';
      setLastError(msg);
      scheduleReconnect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isOwnMessage = (msg: ChatMessage) =>
    currentUserId ? msg.sender_id === currentUserId : false;

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    const map: Record<string, { label: string; color: string }> = {
      property_owner: {
        label: 'Property Manager',
        color: 'bg-blue-500/20 text-blue-400',
      },
      vendor: { label: 'Vendor', color: 'bg-purple-500/20 text-purple-400' },
      tenant: { label: 'Tenant', color: 'bg-green-500/20 text-green-400' },
    };
    const info = map[role.toLowerCase()] || {
      label: role,
      color: 'bg-gray-500/20 text-gray-400',
    };
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full ${info.color} font-medium`}
      >
        {info.label}
      </span>
    );
  };

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      {/* Connection indicator — only visible in development */}
      {isDev && (
        <div className='flex items-center gap-2 px-1 pb-2 text-xs'>
          <span
            className={`h-2 w-2 rounded-full ${
              status === 'connected'
                ? 'bg-green-500'
                : status === 'reconnecting'
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-red-500'
            }`}
          />
          <span className='text-[#BDBDBE]'>
            {status === 'connected'
              ? 'Connected'
              : status === 'reconnecting'
                ? 'Reconnecting...'
                : 'Disconnected'}
          </span>
          {lastError ? (
            <span className='text-[#BDBDBE]/60 truncate' title={lastError}>
              ({lastError})
            </span>
          ) : null}
        </div>
      )}

      {/* Messages area */}
      <div className='flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin'>
        {messages.length === 0 && (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <MessageSquare className='h-10 w-10 text-[#BDBDBE]/30 mb-3' />
            <p className='text-[#BDBDBE] text-sm'>No messages yet</p>
            <p className='text-[#BDBDBE]/60 text-xs mt-1'>
              Start a conversation about this work order
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const own = isOwnMessage(msg);
          return (
            <div
              key={msg.id || `msg-${idx}`}
              className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}
            >
              {!own && (
                <div className='flex items-center gap-1.5 mb-1 px-1'>
                  <span className='text-xs text-[#BDBDBE] font-medium'>
                    {msg.sender_name || 'Unknown'}
                  </span>
                  {getRoleBadge(msg.sender_role)}
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  own
                    ? 'bg-[#F77F00] text-white rounded-br-sm'
                    : 'bg-[#FFFFFF12] text-white rounded-bl-sm'
                }`}
              >
                {msg.message}
              </div>
              <div className='flex items-center gap-1 mt-0.5 px-1'>
                <span className='text-[10px] text-[#BDBDBE]/60'>
                  {formatTime(msg.created_at || msg.createdAt)}
                </span>
                {own && (
                  <span className='text-[10px] text-[#BDBDBE]/60'>
                    {msg.id ? (
                      <CheckCheck className='h-3 w-3 text-[#F77F00]' />
                    ) : (
                      <Clock className='h-3 w-3 text-[#BDBDBE]/40' />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className='flex items-center gap-2 pt-3 mt-2 border-t border-[#434343]'>
        <input
          ref={inputRef}
          type='text'
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Type a message...'
          className='flex-1 bg-[#FFFFFF0D] text-white text-sm rounded-lg px-3 py-2.5 placeholder:text-[#BDBDBE]/50 focus:outline-none focus:ring-1 focus:ring-[#F77F00]/50'
        />
        <Button
          size='sm'
          onClick={() => void handleSend()}
          disabled={!draft.trim()}
          className='bg-[#F77F00] hover:bg-[#f78f20] h-10 w-10 p-0 shrink-0'
        >
          <Send className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
};

export default WorkOrderChat;
