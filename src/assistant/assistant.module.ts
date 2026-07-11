import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [LlmModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}
