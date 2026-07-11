import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para o frontend (SPA). Em produção, restrinja a origem
  // definindo CORS_ORIGIN (ex.: https://app.seudominio.com).
  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  });

  // Prefixo global das rotas: /api
  app.setGlobalPrefix('api');

  // Validação automática de todos os DTOs de entrada.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // rejeita propriedades desconhecidas
      transform: true, // converte payloads em instâncias das classes DTO
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Configuração do Swagger / OpenAPI.
  const config = new DocumentBuilder()
    .setTitle('Guia Hóspede API')
    .setDescription(
      'API para gerenciamento de imóveis de hospedagem: dados do imóvel, ' +
        'acesso, regras da estadia e contato do anfitrião.',
    )
    .setVersion('1.0')
    .addTag('properties', 'Operações sobre imóveis')
    .addTag('health', 'Verificação de saúde da API')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  // Bind em 0.0.0.0 é exigido por plataformas como Render/containers.
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 API em http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger em http://localhost:${port}/docs`);
}

bootstrap();
