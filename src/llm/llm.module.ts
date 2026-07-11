import { Module } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';

/**
 * Módulo compartilhado que expõe o cliente de LLM (OpenRouter) para os
 * demais módulos (guidebook, assistente virtual).
 */
@Module({
  providers: [OpenRouterService],
  exports: [OpenRouterService],
})
export class LlmModule {}
