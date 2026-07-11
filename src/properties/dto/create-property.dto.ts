import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';
import { AmenitiesDto } from './amenities.dto';
import { HostDto } from './host.dto';
import { OperationalDto } from './operational.dto';
import { RulesDto } from './rules.dto';

export class CreatePropertyDto {
  @ApiProperty({ example: 'FLN001', description: 'Código único do imóvel.' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty({ example: 'Apartamento Beira-Mar Florianópolis' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'Apartamento' })
  @IsString()
  @MinLength(1)
  property_type: string;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsInt()
  @Min(0)
  bedroom_quantity: number;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  bathroom_quantity: number;

  @ApiProperty({ example: 4, minimum: 1 })
  @IsInt()
  @Min(1)
  guest_capacity: number;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: OperationalDto })
  @ValidateNested()
  @Type(() => OperationalDto)
  operational: OperationalDto;

  @ApiProperty({ type: RulesDto })
  @ValidateNested()
  @Type(() => RulesDto)
  rules: RulesDto;

  @ApiPropertyOptional({ type: AmenitiesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AmenitiesDto)
  amenities?: AmenitiesDto;

  @ApiProperty({
    type: [String],
    example: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    ],
    description: 'URLs das fotos do imóvel.',
  })
  @IsArray()
  @ArrayMaxSize(50)
  @IsUrl({}, { each: true })
  images: string[];

  @ApiProperty({ type: HostDto })
  @ValidateNested()
  @Type(() => HostDto)
  host: HostDto;
}
