import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyEntity } from './entities/property.entity';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um novo imóvel de hospedagem' })
  @ApiBody({ type: CreatePropertyDto })
  @ApiCreatedResponse({ type: PropertyEntity })
  create(@Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os imóveis' })
  @ApiOkResponse({ type: [PropertyEntity] })
  findAll() {
    return this.propertiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um imóvel pelo id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: PropertyEntity })
  @ApiNotFoundResponse({ description: 'Imóvel não encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.propertiesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um imóvel existente' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdatePropertyDto })
  @ApiOkResponse({ type: PropertyEntity })
  @ApiNotFoundResponse({ description: 'Imóvel não encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(id, dto);
  }
}
