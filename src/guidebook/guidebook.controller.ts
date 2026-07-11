import { Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GuidebookEntity } from './entities/guidebook.entity';
import { GuidebookService } from './guidebook.service';

@ApiTags('guidebook')
@Controller('properties/:id/guidebook')
export class GuidebookController {
  constructor(private readonly guidebook: GuidebookService) {}

  @Get()
  @ApiOperation({
    summary: 'Retorna o guia de experiências do imóvel',
    description:
      'Devolve o guia gerado por IA. Se ainda não existir, ele é gerado sob demanda no primeiro acesso, persistido e retornado.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GuidebookEntity })
  @ApiNotFoundResponse({ description: 'Imóvel não encontrado' })
  @ApiServiceUnavailableResponse({
    description: 'LLM indisponível ou não configurada',
  })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.guidebook.getOrGenerate(id);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Regenera o guia de experiências do imóvel',
    description:
      'Força uma nova geração pelo agente de IA, sobrescrevendo o guia atual.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: GuidebookEntity })
  @ApiNotFoundResponse({ description: 'Imóvel não encontrado' })
  refresh(@Param('id', ParseUUIDPipe) id: string) {
    return this.guidebook.generateAndSave(id);
  }
}
