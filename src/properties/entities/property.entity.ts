import { ApiProperty } from '@nestjs/swagger';
import { GuidebookEntity } from '../../guidebook/entities/guidebook.entity';
import { AddressDto } from '../dto/address.dto';
import { AmenitiesDto } from '../dto/amenities.dto';
import { HostDto } from '../dto/host.dto';
import { OperationalDto } from '../dto/operational.dto';
import { RulesDto } from '../dto/rules.dto';

/** Representação de um imóvel retornado pela API (documentação Swagger). */
export class PropertyEntity {
  @ApiProperty({ example: '5f0b7c1e-2c9a-4a1b-9f2e-1a2b3c4d5e6f' })
  id: string;

  @ApiProperty({ example: 'FLN001' })
  code: string;

  @ApiProperty({ example: 'Apartamento Beira-Mar Florianópolis' })
  name: string;

  @ApiProperty({ example: 'Apartamento' })
  property_type: string;

  @ApiProperty({ example: 2 })
  bedroom_quantity: number;

  @ApiProperty({ example: 1 })
  bathroom_quantity: number;

  @ApiProperty({ example: 4 })
  guest_capacity: number;

  @ApiProperty({ type: AddressDto })
  address: AddressDto;

  @ApiProperty({ type: OperationalDto })
  operational: OperationalDto;

  @ApiProperty({ type: RulesDto })
  rules: RulesDto;

  @ApiProperty({ type: AmenitiesDto })
  amenities: AmenitiesDto;

  @ApiProperty({
    type: [String],
    example: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    ],
  })
  images: string[];

  @ApiProperty({ type: HostDto })
  host: HostDto;

  @ApiProperty({
    type: GuidebookEntity,
    nullable: true,
    description: 'Guia de experiências gerado por IA (null se ainda não gerado).',
  })
  guidebook: GuidebookEntity | null;

  @ApiProperty({ example: '2026-07-11T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-07-11T12:00:00.000Z' })
  updated_at: Date;
}
