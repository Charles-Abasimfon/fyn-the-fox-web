import { ApiBaseResponse, ApiError } from './auth';
import { getRuntimeApiBase } from './config';
import { fetchWithAuth } from './http';

export interface ChatHistoryMessage {
  id?: string;
  complaint_id: string;
  message: string;
  sender_id?: string;
  sender_name?: string;
  sender_role?: string;
  created_at?: string;
  createdAt?: string;
}

export interface FetchChatMessagesData {
  messages: ChatHistoryMessage[];
  nextCursor: string | null;
}

function getBase(): string {
  try {
    return getRuntimeApiBase();
  } catch (e: any) {
    throw new ApiError(e?.message || 'API base URL not configured');
  }
}

export async function fetchChatMessages(params: {
  token: string;
  complaintId: string;
  cursor?: string | null;
}): Promise<FetchChatMessagesData> {
  const { token, complaintId, cursor } = params;
  const base = getBase();

  const url = new URL(
    `${base}/chats/messages/complaints/${encodeURIComponent(complaintId)}`,
  );
  if (cursor) url.searchParams.set('cursor', cursor);

  console.log('[Chat API] Fetching messages from:', url.toString());

  const res = await fetchWithAuth(
    url.toString(),
    { headers: { 'Content-Type': 'application/json' }, cache: 'no-store' },
    token,
  );

  let json: ApiBaseResponse<FetchChatMessagesData> | null = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }

  console.log('[Chat API] Response status:', res.status, '| Raw JSON:', JSON.stringify(json, null, 2));

  if (!res.ok) {
    const msg =
      json?.message || `Failed to fetch chat messages (${res.status})`;
    throw new ApiError(msg, res.status);
  }

  if (!json?.data) throw new ApiError('Malformed chat messages response');

  // Log the shape of json.data to diagnose mismatches
  console.log('[Chat API] json.data keys:', Object.keys(json.data), '| json.data.messages is array:', Array.isArray(json.data.messages));
  // If messages are directly in data (as an array) rather than data.messages, handle both
  const messages = Array.isArray(json.data.messages)
    ? json.data.messages
    : Array.isArray(json.data)
      ? (json.data as unknown as ChatHistoryMessage[])
      : [];
  console.log('[Chat API] Parsed message count:', messages.length);
  return {
    messages,
    nextCursor: (json.data as any).nextCursor ?? null,
  };
}
