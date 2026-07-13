import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  GuidebookAgentService,
  GuidebookData,
} from './guidebook-agent.service';
import { GuidebookService } from './guidebook.service';
import { PrismaService } from '../prisma/prisma.service';

const generated: GuidebookData = {
  welcome_message: 'Bem-vindo!',
  restaurants: [{ name: 'Box 32', distance: '1 km', description: 'x' }],
  attractions: [{ name: 'Joaquina', distance: '18 km', description: 'y' }],
  essentials: [
    { name: 'Farmácia', type: 'pharmacy', distance: '300 m', description: 'z' },
  ],
  seasonal_tips: 'Leve agasalho.',
};

const propertyWithAddress = {
  id: 'uuid-1',
  name: 'Apartamento Beira-Mar',
  propertyType: 'Apartamento',
  address: {
    street: 'Rua Lauro Linhares',
    number: '589',
    neighborhood: 'Trindade',
    city: 'Florianópolis',
    state: 'SC',
  },
};

describe('GuidebookService', () => {
  let service: GuidebookService;
  let prisma: {
    guidebook: { findUnique: jest.Mock; upsert: jest.Mock };
    property: { findUnique: jest.Mock };
  };
  let agent: { generate: jest.Mock; model: string };

  beforeEach(() => {
    prisma = {
      guidebook: { findUnique: jest.fn(), upsert: jest.fn() },
      property: { findUnique: jest.fn() },
    };
    agent = { generate: jest.fn(), model: 'openai/gpt-oss-120b:free' };
    service = new GuidebookService(
      prisma as unknown as PrismaService,
      agent as unknown as GuidebookAgentService,
    );
  });

  describe('getOrGenerate', () => {
    it('retorna o guia persistido sem chamar o agente', async () => {
      prisma.guidebook.findUnique.mockResolvedValue({
        propertyId: 'uuid-1',
        welcomeMessage: 'Já existe',
        restaurants: [],
        attractions: [],
        essentials: [],
        seasonalTips: 'x',
        model: 'm',
        generatedAt: new Date('2026-07-11T00:00:00Z'),
      });

      const result = await service.getOrGenerate('uuid-1');

      expect(agent.generate).not.toHaveBeenCalled();
      expect(result.welcome_message).toBe('Já existe');
      expect(result.property_id).toBe('uuid-1');
    });

    it('gera sob demanda quando ainda não existe', async () => {
      prisma.guidebook.findUnique.mockResolvedValue(null);
      prisma.property.findUnique.mockResolvedValue(propertyWithAddress);
      agent.generate.mockResolvedValue(generated);
      prisma.guidebook.upsert.mockImplementation(({ create }) => ({
        propertyId: create.propertyId,
        welcomeMessage: create.welcomeMessage,
        restaurants: create.restaurants,
        attractions: create.attractions,
        essentials: create.essentials,
        seasonalTips: create.seasonalTips,
        model: create.model,
        generatedAt: create.generatedAt,
      }));

      const result = await service.getOrGenerate('uuid-1');

      expect(agent.generate).toHaveBeenCalledTimes(1);
      expect(prisma.guidebook.upsert).toHaveBeenCalledTimes(1);
      expect(result.welcome_message).toBe('Bem-vindo!');
      expect(result.restaurants[0].name).toBe('Box 32');
      expect(result.model).toBe('openai/gpt-oss-120b:free');
    });
  });

  describe('generateAndSave', () => {
    it('passa o endereço do imóvel para o agente', async () => {
      prisma.property.findUnique.mockResolvedValue(propertyWithAddress);
      agent.generate.mockResolvedValue(generated);
      prisma.guidebook.upsert.mockResolvedValue({
        propertyId: 'uuid-1',
        welcomeMessage: generated.welcome_message,
        restaurants: generated.restaurants,
        attractions: generated.attractions,
        essentials: generated.essentials,
        seasonalTips: generated.seasonal_tips,
        model: 'm',
        generatedAt: new Date(),
      });

      await service.generateAndSave('uuid-1');

      const ctx = agent.generate.mock.calls[0][0];
      expect(ctx.address.city).toBe('Florianópolis');
      expect(ctx.name).toBe('Apartamento Beira-Mar');
    });

    it('lança NotFoundException quando o imóvel não existe', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.generateAndSave('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(agent.generate).not.toHaveBeenCalled();
    });

    it('lança UnprocessableEntityException quando o imóvel não tem endereço', async () => {
      prisma.property.findUnique.mockResolvedValue({
        ...propertyWithAddress,
        address: null,
      });

      await expect(service.generateAndSave('uuid-1')).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });
});
