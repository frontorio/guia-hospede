import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PROPERTY_CREATED,
  PROPERTY_UPDATED,
} from '../guidebook/guidebook.listener';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import {
  propertyInclude,
  toAddressData,
  toAmenitiesData,
  toCreateInput,
  toHostData,
  toOperationalData,
  toResponse,
  toRulesData,
} from './properties.mapper';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  /** Cria um novo imóvel com todas as suas relações. */
  async create(dto: CreatePropertyDto) {
    try {
      const property = await this.prisma.property.create({
        data: toCreateInput(dto),
        include: propertyInclude,
      });
      // Dispara a geração do guia por IA de forma assíncrona.
      this.events.emit(PROPERTY_CREATED, { propertyId: property.id });
      return toResponse(property);
    } catch (error) {
      this.handleKnownErrors(error, dto.code);
      throw error;
    }
  }

  /** Lista todos os imóveis cadastrados. */
  async findAll() {
    const properties = await this.prisma.property.findMany({
      include: propertyInclude,
      orderBy: { createdAt: 'desc' },
    });
    return properties.map(toResponse);
  }

  /** Busca um imóvel pelo id. Lança 404 se não existir. */
  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: propertyInclude,
    });
    if (!property) {
      throw new NotFoundException(`Imóvel com id "${id}" não encontrado.`);
    }
    return toResponse(property);
  }

  /**
   * Atualiza um imóvel existente. Campos de topo ausentes são preservados;
   * sub-objetos enviados substituem (upsert) o registro relacionado.
   */
  async update(id: string, dto: UpdatePropertyDto) {
    await this.ensureExists(id);

    const data: Prisma.PropertyUpdateInput = {};

    if (dto.code !== undefined) data.code = dto.code;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.property_type !== undefined) data.propertyType = dto.property_type;
    if (dto.bedroom_quantity !== undefined)
      data.bedroomQuantity = dto.bedroom_quantity;
    if (dto.bathroom_quantity !== undefined)
      data.bathroomQuantity = dto.bathroom_quantity;
    if (dto.guest_capacity !== undefined)
      data.guestCapacity = dto.guest_capacity;
    if (dto.images !== undefined) data.images = dto.images;

    if (dto.address) {
      const address = toAddressData(dto.address);
      data.address = { upsert: { create: address, update: address } };
    }
    if (dto.operational) {
      const operational = toOperationalData(dto.operational);
      data.operational = {
        upsert: { create: operational, update: operational },
      };
    }
    if (dto.rules) {
      const rules = toRulesData(dto.rules);
      data.rules = { upsert: { create: rules, update: rules } };
    }
    if (dto.amenities) {
      const amenities = toAmenitiesData(dto.amenities);
      data.amenities = { upsert: { create: amenities, update: amenities } };
    }
    if (dto.host) {
      const host = toHostData(dto.host);
      data.host = { upsert: { create: host, update: host } };
    }

    try {
      const property = await this.prisma.property.update({
        where: { id },
        data,
        include: propertyInclude,
      });
      // Endereço pode ter mudado: regenera o guia por IA de forma assíncrona.
      this.events.emit(PROPERTY_UPDATED, { propertyId: property.id });
      return toResponse(property);
    } catch (error) {
      this.handleKnownErrors(error, dto.code);
      throw error;
    }
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.property.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Imóvel com id "${id}" não encontrado.`);
    }
  }

  private handleKnownErrors(error: unknown, code?: string): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        `Já existe um imóvel com o código "${code}".`,
      );
    }
  }
}
