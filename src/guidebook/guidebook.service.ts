import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GuidebookAgentService } from './guidebook-agent.service';
import { GuidebookResponse, toGuidebookResponse } from './guidebook.mapper';

export { GuidebookResponse } from './guidebook.mapper';

@Injectable()
export class GuidebookService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: GuidebookAgentService,
  ) {}

  /**
   * Retorna o guia persistido; se ainda não existir, gera na hora, persiste
   * e retorna (geração "lazy" no primeiro acesso).
   */
  async getOrGenerate(propertyId: string): Promise<GuidebookResponse> {
    const existing = await this.prisma.guidebook.findUnique({
      where: { propertyId },
    });
    if (existing) {
      return toGuidebookResponse(existing);
    }
    return this.generateAndSave(propertyId);
  }

  /** (Re)gera o guia do imóvel e persiste, sobrescrevendo o anterior. */
  async generateAndSave(
    propertyId: string,
    now: Date = new Date(),
  ): Promise<GuidebookResponse> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { address: true },
    });
    if (!property) {
      throw new NotFoundException(
        `Imóvel com id "${propertyId}" não encontrado.`,
      );
    }
    if (!property.address) {
      throw new UnprocessableEntityException(
        'Imóvel sem endereço; não é possível gerar o guia.',
      );
    }

    const data = await this.agent.generate(
      {
        name: property.name,
        propertyType: property.propertyType,
        address: {
          street: property.address.street,
          number: property.address.number,
          neighborhood: property.address.neighborhood,
          city: property.address.city,
          state: property.address.state,
        },
      },
      now,
    );

    const payload = {
      welcomeMessage: data.welcome_message,
      restaurants: data.restaurants as unknown as Prisma.InputJsonValue,
      attractions: data.attractions as unknown as Prisma.InputJsonValue,
      essentials: data.essentials as unknown as Prisma.InputJsonValue,
      seasonalTips: data.seasonal_tips,
      model: this.agent.model,
      generatedAt: now,
    };

    const saved = await this.prisma.guidebook.upsert({
      where: { propertyId },
      create: { propertyId, ...payload },
      update: payload,
    });

    return toGuidebookResponse(saved);
  }
}
