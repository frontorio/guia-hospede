import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class OperationalDto {
  @ApiPropertyOptional({ example: 'SeaHome_FLN001' })
  @IsOptional()
  @IsString()
  wifi_network?: string;

  @ApiPropertyOptional({ example: 'floripa2024' })
  @IsOptional()
  @IsString()
  wifi_password?: string;

  @ApiProperty({ example: true, description: 'Se o check-in é autônomo.' })
  @IsBoolean()
  is_self_checkin: boolean;

  @ApiPropertyOptional({
    example: 'smart_lock',
    description: 'Tipo de acesso: smart_lock, key_safe, reception, etc.',
  })
  @IsOptional()
  @IsString()
  property_access_type?: string;

  @ApiPropertyOptional({
    example: 'Use o código 4521 na fechadura eletrônica',
  })
  @IsOptional()
  @IsString()
  property_access_instructions?: string;

  @ApiPropertyOptional({ example: '4521' })
  @IsOptional()
  @IsString()
  property_password?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  has_parking_spot: boolean;

  @ApiPropertyOptional({ example: 'Vaga 12 — subsolo B1' })
  @IsOptional()
  @IsString()
  parking_spot_identifier?: string;

  @ApiPropertyOptional({ example: 'Portão lateral, código 7890 no interfone' })
  @IsOptional()
  @IsString()
  parking_spot_instructions?: string;
}
