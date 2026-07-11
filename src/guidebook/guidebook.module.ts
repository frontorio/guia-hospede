import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { GuidebookAgentService } from './guidebook-agent.service';
import { GuidebookController } from './guidebook.controller';
import { GuidebookListener } from './guidebook.listener';
import { GuidebookService } from './guidebook.service';

@Module({
  imports: [LlmModule],
  controllers: [GuidebookController],
  providers: [GuidebookAgentService, GuidebookService, GuidebookListener],
  exports: [GuidebookService],
})
export class GuidebookModule {}
