import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { PropertiesService } from './properties.service';

const baseRecord = {
  id: 'uuid-1',
  code: 'FLN001',
  name: 'Apartamento Beira-Mar Florianópolis',
  propertyType: 'Apartamento',
  bedroomQuantity: 2,
  bathroomQuantity: 1,
  guestCapacity: 4,
  images: ['https://example.com/a.jpg'],
  createdAt: new Date('2026-07-11T12:00:00.000Z'),
  updatedAt: new Date('2026-07-11T12:00:00.000Z'),
  address: {
    id: 'a1',
    street: 'Rua Lauro Linhares',
    number: '589',
    complement: 'Apto 301',
    neighborhood: 'Trindade',
    city: 'Florianópolis',
    state: 'SC',
    postalCode: '88036-001',
    propertyId: 'uuid-1',
  },
  operational: {
    id: 'o1',
    wifiNetwork: 'SeaHome_FLN001',
    wifiPassword: 'floripa2024',
    isSelfCheckin: true,
    propertyAccessType: 'smart_lock',
    propertyAccessInstructions: 'Use o código 4521',
    propertyPassword: '4521',
    hasParkingSpot: true,
    parkingSpotIdentifier: 'Vaga 12',
    parkingSpotInstructions: 'Portão lateral',
    propertyId: 'uuid-1',
  },
  rules: {
    id: 'r1',
    checkInTime: '15:00',
    checkOutTime: '11:00',
    allowPet: false,
    smokingPermitted: false,
    suitableForChildren: true,
    suitableForBabies: true,
    eventsPermitted: false,
    propertyId: 'uuid-1',
  },
  amenities: {
    id: 'am1',
    wifi: true,
    tv: true,
    airConditioning: true,
    kitchen: true,
    washingMachine: true,
    elevator: true,
    balcony: true,
    pool: false,
    parking: false,
    propertyId: 'uuid-1',
  },
  host: {
    id: 'h1',
    name: 'Ana Paula',
    phone: '+5548991234567',
    propertyId: 'uuid-1',
  },
};

const createDto: CreatePropertyDto = {
  code: 'FLN001',
  name: 'Apartamento Beira-Mar Florianópolis',
  property_type: 'Apartamento',
  bedroom_quantity: 2,
  bathroom_quantity: 1,
  guest_capacity: 4,
  address: {
    street: 'Rua Lauro Linhares',
    number: '589',
    complement: 'Apto 301',
    neighborhood: 'Trindade',
    city: 'Florianópolis',
    state: 'SC',
    postal_code: '88036-001',
  },
  operational: {
    is_self_checkin: true,
    has_parking_spot: true,
  },
  rules: {
    check_in_time: '15:00',
    check_out_time: '11:00',
    allow_pet: false,
    smoking_permitted: false,
    suitable_for_children: true,
    suitable_for_babies: true,
    events_permitted: false,
  },
  images: ['https://example.com/a.jpg'],
  host: { name: 'Ana Paula', phone: '+5548991234567' },
};

describe('PropertiesService', () => {
  let service: PropertiesService;
  let events: { emit: jest.Mock };
  let prisma: {
    property: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      property: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    events = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventEmitter2, useValue: events },
      ],
    }).compile();

    service = module.get<PropertiesService>(PropertiesService);
  });

  describe('create', () => {
    it('cria um imóvel e devolve a resposta em snake_case', async () => {
      prisma.property.create.mockResolvedValue(baseRecord);

      const result = await service.create(createDto);

      expect(prisma.property.create).toHaveBeenCalledTimes(1);
      expect(result.code).toBe('FLN001');
      expect(result.property_type).toBe('Apartamento');
      expect(result.address?.postal_code).toBe('88036-001');
      expect(events.emit).toHaveBeenCalledWith('property.created', {
        propertyId: 'uuid-1',
      });
    });

    it('lança ConflictException quando o código já existe (P2002)', async () => {
      prisma.property.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('dup', {
          code: 'P2002',
          clientVersion: '5.0.0',
        }),
      );

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('findAll', () => {
    it('retorna a lista mapeada', async () => {
      prisma.property.findMany.mockResolvedValue([baseRecord]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('FLN001');
    });
  });

  describe('findOne', () => {
    it('retorna o imóvel quando encontrado', async () => {
      prisma.property.findUnique.mockResolvedValue(baseRecord);

      const result = await service.findOne('uuid-1');

      expect(result.id).toBe('uuid-1');
    });

    it('lança NotFoundException quando não encontrado', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('atualiza campos de topo e faz upsert das relações enviadas', async () => {
      prisma.property.findUnique.mockResolvedValue({ id: 'uuid-1' });
      prisma.property.update.mockResolvedValue({
        ...baseRecord,
        name: 'Novo nome',
      });

      const result = await service.update('uuid-1', {
        name: 'Novo nome',
        host: { name: 'João', phone: '+5511999999999' },
      });

      expect(prisma.property.update).toHaveBeenCalledTimes(1);
      const callArg = prisma.property.update.mock.calls[0][0];
      expect(callArg.where).toEqual({ id: 'uuid-1' });
      expect(callArg.data.name).toBe('Novo nome');
      expect(callArg.data.host.upsert).toBeDefined();
      expect(callArg.data.address).toBeUndefined();
      expect(result.name).toBe('Novo nome');
      expect(events.emit).toHaveBeenCalledWith('property.updated', {
        propertyId: 'uuid-1',
      });
    });

    it('lança NotFoundException se o imóvel não existir', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { name: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.property.update).not.toHaveBeenCalled();
    });
  });
});
