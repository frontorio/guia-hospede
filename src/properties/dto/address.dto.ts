import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Rua Lauro Linhares' })
  @IsString()
  @MinLength(1)
  street: string;

  @ApiProperty({ example: '589' })
  @IsString()
  @MinLength(1)
  number: string;

  @ApiPropertyOptional({ example: 'Apto 301' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Trindade' })
  @IsString()
  @MinLength(1)
  neighborhood: string;

  @ApiProperty({ example: 'Florianópolis' })
  @IsString()
  @MinLength(1)
  city: string;

  @ApiProperty({ example: 'SC', description: 'UF do estado (2 letras).' })
  @IsString()
  @MinLength(2)
  @MaxLength(2)
  state: string;

  @ApiProperty({ example: '88036-001' })
  @IsString()
  @MinLength(1)
  postal_code: string;
}
