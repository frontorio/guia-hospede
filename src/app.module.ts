import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { PropertiesModule } from './properties/properties.module';
import { GuidebookModule } from './guidebook/guidebook.module';
import { AssistantModule } from './assistant/assistant.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    PropertiesModule,
    GuidebookModule,
    AssistantModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
