import { API_URL, ApiError } from './client';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamHandlers {
  onChunk: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Envia a pergunta ao assistente e consome a resposta em streaming
 * (text/plain, chunks progressivos), chamando `onChunk` a cada pedaço.
 */
export async function streamAssistant(
  propertyId: string,
  message: string,
  history: ChatTurn[],
  { onChunk, signal }: StreamHandlers,
): Promise<void> {
  const res = await fetch(`${API_URL}/properties/${propertyId}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `Erro ${res.status}`;
    try {
      const body = await res.json();
      const m = (body as { message?: unknown })?.message;
      msg = Array.isArray(m) ? m.join(', ') : ((m as string) ?? msg);
    } catch {
      /* corpo não-JSON: mantém a mensagem padrão */
    }
    throw new ApiError(res.status, msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onChunk(text);
  }
}
