import { useEffect, useRef, useState } from 'react';
import { streamAssistant, type ChatTurn } from '../api/assistant';
import { ApiError } from '../api/client';

const SUGGESTIONS = [
  'Qual a senha do WiFi?',
  'Posso trazer meu cachorro?',
  'A que horas posso fazer check-in?',
  'Que restaurantes tem perto?',
];

export function ChatWidget({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // Limpa o timer do efeito de digitação ao desmontar.
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  function setLastAssistant(content: string) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant')
        next[next.length - 1] = { ...last, content };
      return next;
    });
  }

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    setError(null);
    setInput('');
    const history = messages;
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '' },
    ]);
    setBusy(true);

    // Efeito de digitação: os chunks do stream entram num buffer (target) e
    // são revelados progressivamente, caractere a caractere, como se alguém
    // estivesse digitando — independente de o modelo enviar em rajadas.
    const target = { value: '' };
    let shown = 0;
    let done = false;
    let failed: string | null = null;

    const finish = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setBusy(false);
      if (failed) {
        setError(failed);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.content === '')
            return prev.slice(0, -1);
          return prev;
        });
      }
    };

    timerRef.current = window.setInterval(() => {
      if (shown < target.value.length) {
        const remaining = target.value.length - shown;
        // ~2 caracteres por tick; acelera se estiver muito atrás do stream.
        const step = remaining > 60 ? Math.ceil(remaining / 15) : 2;
        shown = Math.min(target.value.length, shown + step);
        setLastAssistant(target.value.slice(0, shown));
      } else if (done) {
        finish();
      }
    }, 18);

    try {
      await streamAssistant(propertyId, question, history, {
        onChunk: (chunk) => {
          target.value += chunk;
        },
      });
    } catch (e) {
      failed =
        e instanceof ApiError
          ? e.message
          : 'Não foi possível falar com o assistente agora.';
    } finally {
      done = true;
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white shadow-lg transition hover:bg-brand-700"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <header className="bg-brand-600 px-4 py-3 text-white">
            <p className="font-semibold leading-tight">Assistente virtual</p>
            <p className="truncate text-xs text-brand-100">{propertyName}</p>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500">
                  Olá! 👋 Pergunte sobre este imóvel — WiFi, regras, check-in,
                  restaurantes próximos…
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={busy}
                      className="rounded-full border border-brand-200 bg-white px-3 py-1 text-xs text-brand-700 transition hover:bg-brand-50 disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              const typing = busy && isLast && m.role === 'assistant';
              return (
                <div
                  key={i}
                  className={m.role === 'user' ? 'text-right' : 'text-left'}
                >
                  <span
                    className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-800'
                    }`}
                  >
                    {m.content === '' && typing ? '…' : m.content}
                    {typing && m.content !== '' && (
                      <span className="ml-0.5 inline-block animate-pulse">
                        ▍
                      </span>
                    )}
                  </span>
                </div>
              );
            })}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3"
          >
            <input
              className="input"
              placeholder="Digite sua pergunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
            <button
              type="submit"
              className="btn-primary shrink-0 px-3"
              disabled={busy || input.trim() === ''}
              aria-label="Enviar"
            >
              {busy ? '…' : '➤'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
