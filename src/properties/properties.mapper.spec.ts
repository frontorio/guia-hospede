import { CreatePropertyDto } from './dto/create-property.dto';
import {
  PropertyWithRelations,
  toCreateInput,
  toResponse,
} from './properties.mapper';

const dto: CreatePropertyDto = {
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
    wifi_network: 'SeaHome_FLN001',
    wifi_password: 'floripa2024',
    is_self_checkin: true,
    property_access_type: 'smart_lock',
    property_access_instructions: 'Use o código 4521',
    property_password: '4521',
    has_parking_spot: true,
    parking_spot_identifier: 'Vaga 12',
    parking_spot_instructions: 'Portão lateral',
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
  amenities: {
    wifi: true,
    tv: true,
    air_conditioning: true,
    kitchen: true,
    washing_machine: true,
    elevator: true,
    balcony: true,
  },
  images: ['https://example.com/a.jpg'],
  host: { name: 'Ana Paula', phone: '+5548991234567' },
};

describe('properties.mapper', () => {
  describe('toCreateInput', () => {
    it('converte snake_case do DTO para camelCase do Prisma', () => {
      const input = toCreateInput(dto);

      expect(input.code).toBe('FLN001');
      expect(input.propertyType).toBe('Apartamento');
      expect(input.bedroomQuantity).toBe(2);
      expect(input.guestCapacity).toBe(4);
      expect(input.images).toEqual(['https://example.com/a.jpg']);
      expect(input.address).toEqual({
        create: expect.objectContaining({ postalCode: '88036-001' }),
      });
      expect(input.host).toEqual({
        create: { name: 'Ana Paula', phone: '+5548991234567' },
      });
    });

    it('preenche amenidades com false quando ausentes', () => {
      const input = toCreateInput({ ...dto, amenities: undefined });
      const create = (input.amenities as { create: Record<string, boolean> })
        .create;
      expect(create.wifi).toBe(false);
      expect(create.pool).toBe(false);
      expect(create.bbqGrill).toBe(false);
      expect(create.dishwasher).toBe(false);
    });
  });

  describe('toResponse', () => {
    it('converte o registro do Prisma de volta para snake_case', () => {
      const now = new Date('2026-07-11T12:00:00.000Z');
      const record: PropertyWithRelations = {
        id: 'uuid-1',
        code: 'FLN001',
        name: 'Apartamento Beira-Mar Florianópolis',
        propertyType: 'Apartamento',
        bedroomQuantity: 2,
        bathroomQuantity: 1,
        guestCapacity: 4,
        images: ['https://example.com/a.jpg'],
        createdAt: now,
        updatedAt: now,
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
          bbqGrill: false,
          dishwasher: false,
          propertyId: 'uuid-1',
        },
        host: {
          id: 'h1',
          name: 'Ana Paula',
          phone: '+5548991234567',
          propertyId: 'uuid-1',
        },
        guidebook: null,
      };

      const response = toResponse(record);

      expect(response).toMatchObject({
        id: 'uuid-1',
        code: 'FLN001',
        property_type: 'Apartamento',
        bedroom_quantity: 2,
        address: { postal_code: '88036-001' },
        operational: { is_self_checkin: true, wifi_network: 'SeaHome_FLN001' },
        rules: { check_in_time: '15:00', allow_pet: false },
        amenities: { air_conditioning: true, washing_machine: true },
        host: { name: 'Ana Paula' },
      });
      expect(response.created_at).toBe(now);
      expect(response.guidebook).toBeNull();
    });

    it('inclui o guidebook quando presente', () => {
      const now = new Date('2026-07-11T12:00:00.000Z');
      const record = {
        id: 'uuid-1',
        code: 'FLN001',
        name: 'Apartamento',
        propertyType: 'Apartamento',
        bedroomQuantity: 2,
        bathroomQuantity: 1,
        guestCapacity: 4,
        images: [],
        createdAt: now,
        updatedAt: now,
        address: null,
        operational: null,
        rules: null,
        amenities: null,
        host: null,
        guidebook: {
          id: 'g1',
          propertyId: 'uuid-1',
          welcomeMessage: 'Bem-vindo!',
          restaurants: [{ name: 'Box 32', distance: '1 km', description: 'x' }],
          attractions: [],
          essentials: [],
          seasonalTips: 'Leve agasalho.',
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          generatedAt: now,
        },
      } as unknown as PropertyWithRelations;

      const response = toResponse(record);

      expect(response.guidebook).toMatchObject({
        property_id: 'uuid-1',
        welcome_message: 'Bem-vindo!',
        seasonal_tips: 'Leve agasalho.',
        model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
      });
      expect(response.guidebook?.restaurants[0].name).toBe('Box 32');
    });
  });
});
