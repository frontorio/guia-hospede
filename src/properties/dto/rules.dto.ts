import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class RulesDto {
  @ApiProperty({
    example: '15:00',
    description: 'Horário de check-in (HH:mm).',
  })
  @IsString()
  @Matches(TIME_REGEX, { message: 'check_in_time deve estar no formato HH:mm' })
  check_in_time: string;

  @ApiProperty({
    example: '11:00',
    description: 'Horário de check-out (HH:mm).',
  })
  @IsString()
  @Matches(TIME_REGEX, {
    message: 'check_out_time deve estar no formato HH:mm',
  })
  check_out_time: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  allow_pet: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  smoking_permitted: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  suitable_for_children: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  suitable_for_babies: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  events_permitted: boolean;
}
