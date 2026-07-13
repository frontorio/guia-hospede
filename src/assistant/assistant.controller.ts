import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AskAssistantDto } from './dto/ask-assistant.dto';
import { AssistantService } from './assistant.service';

@ApiTags('assistant')
@Controller('properties/:id/assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post()
  @ApiOperation({
    summary:
      'Conversa com o assistente virtual do imóvel (resposta em streaming)',
    description:
      'Recebe a pergunta do hóspede e devolve a resposta da IA em streaming (text/plain, chunks progressivos). O assistente responde apenas com base nos dados do imóvel e no guia de experiências.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: AskAssistantDto })
  @ApiProduces('text/plain')
  @ApiNotFoundResponse({ description: 'Imóvel não encontrado' })
  async ask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AskAssistantDto,
    @Res() res: Response,
  ): Promise<void> {
    // A chamada ao provedor é estabelecida aqui; erros iniciais (404/429/…)
    // são lançados ANTES de definir headers/escrever, então o NestJS ainda
    // consegue responder com o status/JSON de erro apropriado.
    const stream = await this.assistant.ask(id, dto);

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    try {
      for await (const chunk of stream) {
        const delta = this.assistant.extractDelta(chunk);
        if (delta) res.write(delta);
      }
    } catch {
      // Já enviamos 200 + texto parcial; sinaliza a falha no próprio corpo.
      res.write('\n\n[Erro ao gerar a resposta. Tente novamente.]');
    } finally {
      res.end();
    }
  }
}
