import { Prisma } from '@prisma/client';
import { toGuidebookResponse } from '../guidebook/guidebook.mapper';
import { CreatePropertyDto } from './dto/create-property.dto';
import { AddressDto } from './dto/address.dto';
import { OperationalDto } from './dto/operational.dto';
import { RulesDto } from './dto/rules.dto';
import { AmenitiesDto } from './dto/amenities.dto';
import { HostDto } from './dto/host.dto';

/** Property com todas as relações carregadas. */
const propertyInclude = {
  address: true,
  operational: true,
  rules: true,
  amenities: true,
  host: true,
  guidebook: true,
} satisfies Prisma.PropertyInclude;

export type PropertyWithRelations = Prisma.PropertyGetPayload<{
  include: typeof propertyInclude;
}>;

export { propertyInclude };

/* -------------------------------------------------------------------------- */
/* DTO (snake_case) -> Prisma (camelCase)                                     */
/* -------------------------------------------------------------------------- */

export function toAddressData(
  dto: AddressDto,
): Prisma.AddressCreateWithoutPropertyInput {
  return {
    street: dto.street,
    number: dto.number,
    complement: dto.complement ?? null,
    neighborhood: dto.neighborhood,
    city: dto.city,
    state: dto.state,
    postalCode: dto.postal_code,
  };
}

export function toOperationalData(
  dto: OperationalDto,
): Prisma.OperationalCreateWithoutPropertyInput {
  return {
    wifiNetwork: dto.wifi_network ?? null,
    wifiPassword: dto.wifi_password ?? null,
    isSelfCheckin: dto.is_self_checkin,
    propertyAccessType: dto.property_access_type ?? null,
    propertyAccessInstructions: dto.property_access_instructions ?? null,
    propertyPassword: dto.property_password ?? null,
    hasParkingSpot: dto.has_parking_spot,
    parkingSpotIdentifier: dto.parking_spot_identifier ?? null,
    parkingSpotInstructions: dto.parking_spot_instructions ?? null,
  };
}

export function toRulesData(
  dto: RulesDto,
): Prisma.StayRulesCreateWithoutPropertyInput {
  return {
    checkInTime: dto.check_in_time,
    checkOutTime: dto.check_out_time,
    allowPet: dto.allow_pet,
    smokingPermitted: dto.smoking_permitted,
    suitableForChildren: dto.suitable_for_children,
    suitableForBabies: dto.suitable_for_babies,
    eventsPermitted: dto.events_permitted,
  };
}

export function toAmenitiesData(
  dto: AmenitiesDto,
): Prisma.AmenitiesCreateWithoutPropertyInput {
  return {
    wifi: dto.wifi ?? false,
    tv: dto.tv ?? false,
    airConditioning: dto.air_conditioning ?? false,
    kitchen: dto.kitchen ?? false,
    washingMachine: dto.washing_machine ?? false,
    elevator: dto.elevator ?? false,
    balcony: dto.balcony ?? false,
    pool: dto.pool ?? false,
    parking: dto.parking ?? false,
    bbqGrill: dto.bbq_grill ?? false,
    dishwasher: dto.dishwasher ?? false,
  };
}

export function toHostData(
  dto: HostDto,
): Prisma.HostCreateWithoutPropertyInput {
  return {
    name: dto.name,
    phone: dto.phone,
  };
}

export function toCreateInput(
  dto: CreatePropertyDto,
): Prisma.PropertyCreateInput {
  return {
    code: dto.code,
    name: dto.name,
    propertyType: dto.property_type,
    bedroomQuantity: dto.bedroom_quantity,
    bathroomQuantity: dto.bathroom_quantity,
    guestCapacity: dto.guest_capacity,
    images: dto.images,
    address: { create: toAddressData(dto.address) },
    operational: { create: toOperationalData(dto.operational) },
    rules: { create: toRulesData(dto.rules) },
    amenities: {
      create: toAmenitiesData(dto.amenities ?? new AmenitiesDto()),
    },
    host: { create: toHostData(dto.host) },
  };
}

/* -------------------------------------------------------------------------- */
/* Prisma (camelCase) -> resposta JSON (snake_case)                           */
/* -------------------------------------------------------------------------- */

export function toResponse(property: PropertyWithRelations) {
  return {
    id: property.id,
    code: property.code,
    name: property.name,
    property_type: property.propertyType,
    bedroom_quantity: property.bedroomQuantity,
    bathroom_quantity: property.bathroomQuantity,
    guest_capacity: property.guestCapacity,
    address: property.address
      ? {
          street: property.address.street,
          number: property.address.number,
          complement: property.address.complement,
          neighborhood: property.address.neighborhood,
          city: property.address.city,
          state: property.address.state,
          postal_code: property.address.postalCode,
        }
      : null,
    operational: property.operational
      ? {
          wifi_network: property.operational.wifiNetwork,
          wifi_password: property.operational.wifiPassword,
          is_self_checkin: property.operational.isSelfCheckin,
          property_access_type: property.operational.propertyAccessType,
          property_access_instructions:
            property.operational.propertyAccessInstructions,
          property_password: property.operational.propertyPassword,
          has_parking_spot: property.operational.hasParkingSpot,
          parking_spot_identifier: property.operational.parkingSpotIdentifier,
          parking_spot_instructions:
            property.operational.parkingSpotInstructions,
        }
      : null,
    rules: property.rules
      ? {
          check_in_time: property.rules.checkInTime,
          check_out_time: property.rules.checkOutTime,
          allow_pet: property.rules.allowPet,
          smoking_permitted: property.rules.smokingPermitted,
          suitable_for_children: property.rules.suitableForChildren,
          suitable_for_babies: property.rules.suitableForBabies,
          events_permitted: property.rules.eventsPermitted,
        }
      : null,
    amenities: property.amenities
      ? {
          wifi: property.amenities.wifi,
          tv: property.amenities.tv,
          air_conditioning: property.amenities.airConditioning,
          kitchen: property.amenities.kitchen,
          washing_machine: property.amenities.washingMachine,
          elevator: property.amenities.elevator,
          balcony: property.amenities.balcony,
          pool: property.amenities.pool,
          parking: property.amenities.parking,
          bbq_grill: property.amenities.bbqGrill,
          dishwasher: property.amenities.dishwasher,
        }
      : null,
    images: property.images,
    host: property.host
      ? {
          name: property.host.name,
          phone: property.host.phone,
        }
      : null,
    guidebook: property.guidebook
      ? toGuidebookResponse(property.guidebook)
      : null,
    created_at: property.createdAt,
    updated_at: property.updatedAt,
  };
}
