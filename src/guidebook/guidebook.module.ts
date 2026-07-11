import { Module } from '@nestjs/common';
import { GuidebookAgentService } from './guidebook-agent.service';
import { GuidebookController } from './guidebook.controller';
import { GuidebookListener } from './guidebook.listener';
import { GuidebookService } from './guidebook.service';
import { OpenRouterService } from './llm/openrouter.service';

@Module({
  controllers: [GuidebookController],
  providers: [
    OpenRouterService,
    GuidebookAgentService,
    GuidebookService,
    GuidebookListener,
  ],
  exports: [GuidebookService],
})
export class GuidebookModule {}
