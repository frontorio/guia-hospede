import { GuidebookData } from './guidebook-agent.service';

/** Guidebook retornado pela API (snake_case). */
export interface GuidebookResponse extends GuidebookData {
  property_id: string;
  model: string | null;
  generated_at: Date;
}

/** Formato do registro Guidebook vindo do Prisma (camelCase, jsonb cru). */
export interface GuidebookRecord {
  propertyId: string;
  welcomeMessage: string;
  restaurants: unknown;
  attractions: unknown;
  essentials: unknown;
  seasonalTips: string;
  model: string | null;
  generatedAt: Date;
}

/** Converte o registro do Prisma para a resposta em snake_case da API. */
export function toGuidebookResponse(
  guidebook: GuidebookRecord,
): GuidebookResponse {
  return {
    property_id: guidebook.propertyId,
    welcome_message: guidebook.welcomeMessage,
    restaurants: guidebook.restaurants as GuidebookData['restaurants'],
    attractions: guidebook.attractions as GuidebookData['attractions'],
    essentials: guidebook.essentials as GuidebookData['essentials'],
    seasonal_tips: guidebook.seasonalTips,
    model: guidebook.model,
    generated_at: guidebook.generatedAt,
  };
}
