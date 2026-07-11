import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Preserva um `import()` dinâmico REAL mesmo o projeto compilando para
 * CommonJS. O `@openrouter/sdk` é publicado apenas como ESM; um `import`
 * estático seria transpilado para `require()` e o Node lançaria
 * `ERR_REQUIRE_ESM`. Envolvê-lo em `new Function` impede o TypeScript de
 * rebaixar o `import()` para `require()`.
 */
const importEsm = new Function(
  'specifier',
  'return import(specifier)',
) as (specifier: string) => Promise<any>;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Cliente fino sobre o OpenRouter SDK. Isola a dependência ESM e expõe
 * métodos de chat (bloqueante e por streaming).
 */
@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private client: any;

  constructor(private readonly config: ConfigService) {}

  /** Indica se há chave de API configurada. */
  get isConfigured(): boolean {
    return Boolean(this.config.get<string>('OPENROUTER_API_KEY'));
  }

  /** Modelo normalizado (remove o prefixo opcional "openrouter:"). */
  get model(): string {
    const raw =
      this.config.get<string>('LLM_MODEL') ?? 'openai/gpt-oss-120b:free';
    return raw.startsWith('openrouter:')
      ? raw.slice('openrouter:'.length)
      : raw;
  }

  /**
   * Teto padrão de tokens de saída (env `LLM_MAX_TOKENS`, default 6000).
   * Usado quando a chamada não especifica `maxTokens`. Precisa ser alto o
   * suficiente para modelos de "reasoning" não cortarem a resposta.
   */
  get maxTokens(): number {
    const raw = this.config.get<string>('LLM_MAX_TOKENS');
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : 6000;
  }

  private async getClient(): Promise<any> {
    if (this.client) return this.client;

    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENROUTER_API_KEY não configurada; a integração com IA está indisponível.',
      );
    }

    const { OpenRouter } = await importEsm('@openrouter/sdk');
    const serverURL = this.config.get<string>('OPENROUTER_BASE_URL');
    this.client = new OpenRouter({
      apiKey,
      ...(serverURL ? { serverURL } : {}),
    });
    return this.client;
  }

  /** Envia as mensagens ao modelo e retorna o conteúdo textual da resposta. */
  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const client = await this.getClient();

    try {
      const result = await client.chat.send({
        chatRequest: {
          model: this.model,
          messages,
          maxTokens: opts.maxTokens ?? this.maxTokens,
          ...(opts.temperature !== undefined
            ? { temperature: opts.temperature }
            : {}),
          ...(opts.json ? { responseFormat: { type: 'json_object' } } : {}),
        },
      });

      const content = result?.choices?.[0]?.message?.content;
      return this.coerceContent(content);
    } catch (error) {
      throw this.translateError(error);
    }
  }

  /**
   * Abre um stream de chat. Retorna um iterável assíncrono de chunks já com a
   * chamada estabelecida — assim erros iniciais (ex.: 429) são lançados ANTES
   * de qualquer escrita na resposta HTTP. Use `extractDelta` em cada chunk.
   */
  async openStream(
    messages: ChatMessage[],
    opts: ChatOptions = {},
  ): Promise<AsyncIterable<any>> {
    const client = await this.getClient();
    try {
      return await client.chat.send({
        chatRequest: {
          model: this.model,
          messages,
          stream: true,
          maxTokens: opts.maxTokens ?? this.maxTokens,
          ...(opts.temperature !== undefined
            ? { temperature: opts.temperature }
            : {}),
        },
      });
    } catch (error) {
      throw this.translateError(error);
    }
  }

  /** Extrai o texto incremental (delta) de um chunk de streaming. */
  extractDelta(chunk: any): string {
    return this.coerceContent(chunk?.choices?.[0]?.delta?.content);
  }

  /** Converte erros do SDK em `HttpException` (traduz o erro para status HTTP). */
  translateError(error: unknown): HttpException {
    if (error instanceof HttpException) return error;

    const err = error as {
      statusCode?: number;
      message?: string;
      body?: string;
    };
    const status = err?.statusCode;
    const detail = this.extractProviderMessage(err) ?? err?.message ?? 'erro';

    if (status) {
      this.logger.warn(`OpenRouter respondeu ${status}: ${detail}`);
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        return new HttpException(
          `Modelo "${this.model}" com rate-limit no OpenRouter. Tente novamente em instantes ou use outro modelo/conta.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        return new HttpException(
          'Credenciais do OpenRouter inválidas ou sem permissão.',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return new HttpException(
        `Falha ao chamar a LLM (${status}): ${detail}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error(`Falha ao chamar o OpenRouter: ${detail}`);
    return new ServiceUnavailableException(
      'Serviço de LLM indisponível no momento.',
    );
  }

  /** Extrai a mensagem do provedor do corpo JSON de erro, se houver. */
  private extractProviderMessage(err: { body?: string }): string | undefined {
    if (!err?.body) return undefined;
    try {
      const parsed = JSON.parse(err.body);
      return parsed?.error?.metadata?.raw ?? parsed?.error?.message;
    } catch {
      return undefined;
    }
  }

  /** A resposta pode vir como string ou como partes; normaliza para string. */
  private coerceContent(content: unknown): string {
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
      return content
        .map((part: any) =>
          typeof part === 'string' ? part : (part?.text ?? ''),
        )
        .join('');
    }
    return content == null ? '' : String(content);
  }
}
