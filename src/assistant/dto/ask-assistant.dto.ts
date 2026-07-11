import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ChatTurnDto {
  @ApiProperty({ enum: ['user', 'assistant'], example: 'user' })
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @ApiProperty({ example: 'Qual a senha do WiFi?' })
  @IsString()
  @MinLength(1)
  content: string;
}

export class AskAssistantDto {
  @ApiProperty({
    example: 'Qual a senha do WiFi?',
    description: 'Pergunta atual do hóspede.',
  })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiPropertyOptional({
    type: [ChatTurnDto],
    description: 'Histórico da conversa (turnos anteriores), para contexto.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history?: ChatTurnDto[];
}
