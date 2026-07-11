import { ApiProperty } from '@nestjs/swagger';

export class GuideItemEntity {
  @ApiProperty({ example: 'Box 32' })
  name: string;

  @ApiProperty({ example: 'Aprox. 1,2 km' })
  distance: string;

  @ApiProperty({
    example: 'Boteco tradicional de Florianópolis, famoso pelos petiscos.',
  })
  description: string;
}

export class EssentialItemEntity extends GuideItemEntity {
  @ApiProperty({
    example: 'pharmacy',
    description: 'Categoria: pharmacy, supermarket ou hospital.',
  })
  type: string;
}

export class GuidebookEntity {
  @ApiProperty({ example: '5f0b7c1e-2c9a-4a1b-9f2e-1a2b3c4d5e6f' })
  property_id: string;

  @ApiProperty({
    example:
      'Seu apartamento fica no coração da Trindade, a poucos minutos das principais atrações da ilha...',
  })
  welcome_message: string;

  @ApiProperty({ type: [GuideItemEntity] })
  restaurants: GuideItemEntity[];

  @ApiProperty({ type: [GuideItemEntity] })
  attractions: GuideItemEntity[];

  @ApiProperty({ type: [EssentialItemEntity] })
  essentials: EssentialItemEntity[];

  @ApiProperty({
    example:
      'Em julho as temperaturas ficam entre 12°C e 20°C. Leve um agasalho.',
  })
  seasonal_tips: string;

  @ApiProperty({ example: 'openai/gpt-oss-120b:free', nullable: true })
  model: string | null;

  @ApiProperty({ example: '2026-07-11T12:00:00.000Z' })
  generated_at: Date;
}
