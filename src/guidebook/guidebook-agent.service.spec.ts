import { UnprocessableEntityException } from '@nestjs/common';
import { GuidebookAgentService, GuidebookContext } from './guidebook-agent.service';
import { OpenRouterService } from './llm/openrouter.service';

const context: GuidebookContext = {
  name: 'Apartamento Beira-Mar Florianópolis',
  propertyType: 'Apartamento',
  address: {
    street: 'Rua Lauro Linhares',
    number: '589',
    neighborhood: 'Trindade',
    city: 'Florianópolis',
    state: 'SC',
  },
};

const validJson = JSON.stringify({
  welcome_message: 'Bem-vindo à Trindade!',
  restaurants: [
    { name: 'Box 32', distance: 'Aprox. 1,2 km', description: 'Boteco.' },
  ],
  attractions: [
    { name: 'Praia da Joaquina', distance: 'Aprox. 18 km', description: 'Surf.' },
  ],
  essentials: [
    {
      name: 'Farmácia Catarinense',
      type: 'pharmacy',
      distance: 'Aprox. 300 m',
      description: '24h.',
    },
  ],
  seasonal_tips: 'Em julho leve agasalho.',
});

describe('GuidebookAgentService', () => {
  let agent: GuidebookAgentService;
  let llm: { chat: jest.Mock; model: string };

  beforeEach(() => {
    llm = { chat: jest.fn(), model: 'openai/gpt-oss-120b:free' };
    agent = new GuidebookAgentService(llm as unknown as OpenRouterService);
  });

  describe('buildMessages', () => {
    it('inclui endereço, imóvel e contexto sazonal no prompt', () => {
      const messages = agent.buildMessages(context, new Date('2026-07-11T12:00:00Z'));
      const user = messages.find((m) => m.role === 'user')!.content;

      expect(messages[0].role).toBe('system');
      expect(user).toContain('Rua Lauro Linhares, 589');
      expect(user).toContain('Trindade');
      expect(user).toContain('Florianópolis/SC');
      expect(user).toContain('julho');
      expect(user).toContain('inverno'); // hemisfério sul, julho
    });
  });

  describe('generate', () => {
    it('chama a LLM em modo JSON e devolve a estrutura parseada', async () => {
      llm.chat.mockResolvedValue(validJson);

      const data = await agent.generate(context, new Date('2026-07-11T12:00:00Z'));

      expect(llm.chat).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ json: true }),
      );
      expect(data.welcome_message).toBe('Bem-vindo à Trindade!');
      expect(data.restaurants).toHaveLength(1);
      expect(data.essentials[0].type).toBe('pharmacy');
    });
  });

  describe('parse', () => {
    it('extrai JSON de resposta cercada por markdown (```json)', () => {
      const raw = 'Claro!\n```json\n' + validJson + '\n```\nEspero ter ajudado.';
      const data = agent.parse(raw);
      expect(data.welcome_message).toBe('Bem-vindo à Trindade!');
      expect(data.attractions[0].name).toBe('Praia da Joaquina');
    });

    it('extrai JSON de texto com conteúdo antes e depois do objeto', () => {
      const raw = 'Segue o guia: ' + validJson + ' Fim.';
      const data = agent.parse(raw);
      expect(data.restaurants[0].name).toBe('Box 32');
    });

    it('preenche listas ausentes com arrays vazios', () => {
      const data = agent.parse('{"welcome_message":"oi","seasonal_tips":"x"}');
      expect(data.restaurants).toEqual([]);
      expect(data.attractions).toEqual([]);
      expect(data.essentials).toEqual([]);
    });

    it('lança UnprocessableEntityException para JSON inválido', () => {
      expect(() => agent.parse('não é json')).toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
