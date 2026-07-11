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
 * Cliente fino sobre o OpenRouter SDK. Isola a dependência ESM e expõe um
 * método `chat` simples que devolve o texto da resposta.
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

  private async getClient(): Promise<any> {
    if (this.client) return this.client;

    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'OPENROUTER_API_KEY não configurada; a geração do guia por IA está indisponível.',
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
          ...(opts.temperature !== undefined
            ? { temperature: opts.temperature }
            : {}),
          ...(opts.maxTokens !== undefined
            ? { maxTokens: opts.maxTokens }
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
   * Converte erros do SDK do OpenRouter em exceções HTTP determinísticas,
   * preservando o status de origem (ex.: 429 de rate-limit) quando possível.
   */
  private translateError(error: unknown): HttpException {
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
      if (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) {
        return new HttpException(
          'Credenciais do OpenRouter inválidas ou sem permissão.',
          HttpStatus.BAD_GATEWAY,
        );
      }
      return new HttpException(
        `Falha ao gerar o guia via LLM (${status}): ${detail}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    this.logger.error(`Falha ao chamar o OpenRouter: ${detail}`);
    return new ServiceUnavailableException(
      'Serviço de LLM indisponível no momento.',
    );
  }

  /** Extrai a mensagem do provedor do corpo JSON de erro, se houver. */
  private extractProviderMessage(err: {
    body?: string;
  }): string | undefined {
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
