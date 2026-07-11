import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class HostDto {
  @ApiProperty({ example: 'Ana Paula' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: '+5548991234567' })
  @IsString()
  @MinLength(1)
  phone: string;
}
