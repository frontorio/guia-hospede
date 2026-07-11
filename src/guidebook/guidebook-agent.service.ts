import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ChatMessage, OpenRouterService } from '../llm/openrouter.service';

/** Endereço mínimo necessário para contextualizar o guia. */
export interface GuidebookAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Contexto do imóvel enviado ao agente. */
export interface GuidebookContext {
  name: string;
  propertyType: string;
  address: GuidebookAddress;
}

export interface GuideItem {
  name: string;
  distance: string;
  description: string;
}

export interface EssentialItem extends GuideItem {
  type: string;
}

/** Estrutura do guia gerado, no formato de persistência (snake_case). */
export interface GuidebookData {
  welcome_message: string;
  restaurants: GuideItem[];
  attractions: GuideItem[];
  essentials: EssentialItem[];
  seasonal_tips: string;
}

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

// Estações no hemisfério sul (Brasil), indexadas pelo mês (0 = janeiro).
const ESTACOES = [
  'verão',
  'verão',
  'outono',
  'outono',
  'outono',
  'inverno',
  'inverno',
  'inverno',
  'primavera',
  'primavera',
  'primavera',
  'verão',
];

/**
 * Agente responsável por transformar o endereço de um imóvel em um guia de
 * experiências: monta o prompt, chama a LLM e faz o parse do resultado.
 */
@Injectable()
export class GuidebookAgentService {
  private readonly logger = new Logger(GuidebookAgentService.name);

  constructor(private readonly llm: OpenRouterService) {}

  /** Nome do modelo usado (para rastreabilidade). */
  get model(): string {
    return this.llm.model;
  }

  /** Gera o guia para o imóvel informado. */
  async generate(
    context: GuidebookContext,
    now: Date = new Date(),
  ): Promise<GuidebookData> {
    const messages = this.buildMessages(context, now);
    this.logger.log(
      `Gerando guia para "${context.name}" (${context.address.city}/${context.address.state})`,
    );
    const raw = await this.llm.chat(messages, {
      json: true,
      temperature: 0.7,
      maxTokens: 2000,
    });
    return this.parse(raw);
  }

  /** Monta as mensagens (system + user) enviadas ao modelo. */
  buildMessages(context: GuidebookContext, now: Date): ChatMessage[] {
    const { name, propertyType, address } = context;
    const monthName = MESES[now.getMonth()];
    const season = ESTACOES[now.getMonth()];
    const today = now.toISOString().slice(0, 10);
    const fullAddress = `${address.street}, ${address.number} - ${address.neighborhood}, ${address.city}/${address.state}`;

    const system = [
      'Você é um concierge local especialista em hospitalidade no Brasil.',
      'Gera guias de experiências para hóspedes de imóveis de temporada.',
      'O PONTO DE REFERÊNCIA é a RUA exata do imóvel (logradouro), combinada com a cidade e o estado.',
      'Localize essa rua real no mapa e recomende SOMENTE lugares reais e existentes nas proximidades dela.',
      'Todas as distâncias devem ser medidas a partir dessa rua específica e ser plausíveis para o trajeto real.',
      'Não invente estabelecimentos: use apenas locais que de fato existem próximos a essa rua/cidade.',
      'Responda SEMPRE em português do Brasil.',
      'Responda EXCLUSIVAMENTE com um objeto JSON válido, sem texto extra, sem markdown, sem cercas de código.',
    ].join(' ');

    const user = [
      `Imóvel: "${name}" (${propertyType}).`,
      `Ponto de referência (rua): "${address.street}", em ${address.neighborhood}, ${address.city}/${address.state}.`,
      `Endereço completo: ${fullAddress}.`,
      `Calcule TODAS as distâncias partindo da rua "${address.street}" (${address.city}/${address.state}).`,
      `Data de hoje: ${today} (mês de ${monthName}, ${season} no hemisfério sul).`,
      '',
      'Gere um guia com EXATAMENTE esta estrutura JSON:',
      '{',
      '  "welcome_message": "mensagem de boas-vindas calorosa e personalizada citando o bairro/cidade",',
      '  "restaurants": [ {"name": "", "distance": "Aprox. X km", "description": ""} ],',
      '  "attractions": [ {"name": "", "distance": "Aprox. X km", "description": ""} ],',
      '  "essentials": [ {"name": "", "type": "pharmacy|supermarket|hospital", "distance": "", "description": ""} ],',
      '  "seasonal_tips": "dica relevante para a época atual do ano (clima/eventos) para esta cidade"',
      '}',
      '',
      'Regras de quantidade:',
      '- restaurants: 4 a 5 opções reais.',
      '- attractions: 3 a 4 opções reais.',
      '- essentials: inclua ao menos uma farmácia (pharmacy), um supermercado (supermarket) e um hospital (hospital) próximos.',
      '- seasonal_tips: leve em conta que hoje é ' +
        monthName +
        ' (' +
        season +
        ').',
    ].join('\n');

    return [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
  }

  /** Faz o parse robusto da resposta do modelo em GuidebookData. */
  parse(raw: string): GuidebookData {
    const jsonText = this.extractJson(raw);
    let obj: any;
    try {
      obj = JSON.parse(jsonText);
    } catch {
      this.logger.error(`Resposta da LLM não é JSON válido: ${raw.slice(0, 200)}`);
      throw new UnprocessableEntityException(
        'A LLM não retornou um JSON válido para o guia.',
      );
    }

    return {
      welcome_message: String(obj.welcome_message ?? ''),
      restaurants: this.normalizeItems(obj.restaurants),
      attractions: this.normalizeItems(obj.attractions),
      essentials: this.normalizeEssentials(obj.essentials),
      seasonal_tips: String(obj.seasonal_tips ?? ''),
    };
  }

  /**
   * Extrai o objeto JSON da resposta, tolerando cercas de código markdown
   * (```json ... ```) e texto antes/depois do objeto.
   */
  private extractJson(raw: string): string {
    let text = (raw ?? '').trim();
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      text = fence[1].trim();
    }
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first !== -1 && last !== -1 && last > first) {
      return text.slice(first, last + 1);
    }
    return text;
  }

  private normalizeItems(value: unknown): GuideItem[] {
    if (!Array.isArray(value)) return [];
    return value.map((item: any) => ({
      name: String(item?.name ?? ''),
      distance: String(item?.distance ?? ''),
      description: String(item?.description ?? ''),
    }));
  }

  private normalizeEssentials(value: unknown): EssentialItem[] {
    if (!Array.isArray(value)) return [];
    return value.map((item: any) => ({
      name: String(item?.name ?? ''),
      type: String(item?.type ?? ''),
      distance: String(item?.distance ?? ''),
      description: String(item?.description ?? ''),
    }));
  }
}
