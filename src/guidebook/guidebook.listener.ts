import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GuidebookService } from './guidebook.service';

/** Payload dos eventos de imóvel. */
export interface PropertyChangedEvent {
  propertyId: string;
}

export const PROPERTY_CREATED = 'property.created';
export const PROPERTY_UPDATED = 'property.updated';

/**
 * Dispara a geração do guia por IA de forma assíncrona quando um imóvel é
 * criado ou atualizado. Falhas são registradas e não afetam a requisição
 * original (a geração também acontece sob demanda no primeiro GET do guia).
 */
@Injectable()
export class GuidebookListener {
  private readonly logger = new Logger(GuidebookListener.name);

  constructor(private readonly guidebook: GuidebookService) {}

  @OnEvent(PROPERTY_CREATED, { async: true })
  @OnEvent(PROPERTY_UPDATED, { async: true })
  async handlePropertyChanged(event: PropertyChangedEvent): Promise<void> {
    try {
      await this.guidebook.generateAndSave(event.propertyId);
      this.logger.log(`Guia gerado para o imóvel ${event.propertyId}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Não foi possível gerar o guia do imóvel ${event.propertyId}: ${message}`,
      );
    }
  }
}
