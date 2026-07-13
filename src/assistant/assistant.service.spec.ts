import { NotFoundException } from '@nestjs/common';
import { OpenRouterService } from '../llm/openrouter.service';
import { PrismaService } from '../prisma/prisma.service';
import { AssistantService } from './assistant.service';

// Objeto no formato retornado por toResponse (o que é injetado no contexto).
const property: any = {
  id: 'uuid-1',
  code: 'FLN001',
  name: 'Apartamento Beira-Mar',
  property_type: 'Apartamento',
  bedroom_quantity: 2,
  bathroom_quantity: 1,
  guest_capacity: 4,
  address: { city: 'Florianópolis', state: 'SC' },
  operational: { wifi_network: 'SeaHome', wifi_password: 'floripa2024' },
  rules: { check_in_time: '15:00', allow_pet: false },
  amenities: { wifi: true },
  images: [],
  host: { name: 'Ana Paula', phone: '+5548991234567' },
  guidebook: {
    welcome_message: 'Bem-vindo!',
    restaurants: [{ name: 'Box 32', distance: '1 km', description: 'Boteco' }],
    attractions: [],
    essentials: [],
    seasonal_tips: 'Leve agasalho.',
  },
};

describe('AssistantService', () => {
  let service: AssistantService;
  let prisma: { property: { findUnique: jest.Mock } };
  let llm: { openStream: jest.Mock; extractDelta: jest.Mock };

  beforeEach(() => {
    prisma = { property: { findUnique: jest.fn() } };
    llm = { openStream: jest.fn(), extractDelta: jest.fn() };
    service = new AssistantService(
      prisma as unknown as PrismaService,
      llm as unknown as OpenRouterService,
    );
  });

  describe('buildMessages', () => {
    it('injeta os dados do imóvel e as regras anti-invenção no system prompt', () => {
      const messages = service.buildMessages(property, {
        message: 'Qual a senha do WiFi?',
      });

      const system = messages[0];
      expect(system.role).toBe('system');
      // Dados sensíveis/contextuais presentes:
      expect(system.content).toContain('floripa2024'); // senha do WiFi
      expect(system.content).toContain('Box 32'); // restaurante do guia
      expect(system.content).toContain('Ana Paula'); // anfitrião (fallback)
      // Regras de grounding:
      expect(system.content).toContain('EXCLUSIVAMENTE');
      expect(system.content.toLowerCase()).toContain('não invente');
    });

    it('inclui o histórico e coloca a pergunta atual por último', () => {
      const messages = service.buildMessages(property, {
        message: 'E o check-in?',
        history: [
          { role: 'user', content: 'Oi' },
          { role: 'assistant', content: 'Olá! Como posso ajudar?' },
        ],
      });

      expect(messages).toHaveLength(4); // system + 2 histórico + pergunta
      expect(messages[1]).toEqual({ role: 'user', content: 'Oi' });
      expect(messages[messages.length - 1]).toEqual({
        role: 'user',
        content: 'E o check-in?',
      });
    });
  });

  describe('ask', () => {
    it('abre o stream quando o imóvel existe', async () => {
      prisma.property.findUnique.mockResolvedValue({
        id: 'uuid-1',
        code: 'FLN001',
        name: 'Apartamento Beira-Mar',
        propertyType: 'Apartamento',
        bedroomQuantity: 2,
        bathroomQuantity: 1,
        guestCapacity: 4,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        address: null,
        operational: null,
        rules: null,
        amenities: null,
        host: null,
        guidebook: null,
      });
      const fakeStream = (async function* () {})();
      llm.openStream.mockResolvedValue(fakeStream);

      const result = await service.ask('uuid-1', { message: 'Oi' });

      expect(llm.openStream).toHaveBeenCalledTimes(1);
      expect(result).toBe(fakeStream);
    });

    it('lança NotFoundException quando o imóvel não existe', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.ask('missing', { message: 'Oi' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(llm.openStream).not.toHaveBeenCalled();
    });
  });
});
