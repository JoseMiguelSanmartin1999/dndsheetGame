import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Define JWT_SECRET en Backend/.env con al menos 32 caracteres aleatorios.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('Define DATABASE_URL en Backend/.env (cadena de conexión de PostgreSQL).');
  }

  const app = await NestFactory.create(AppModule);
  // Solo el frontend propio puede llamar a la API desde el navegador.
  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:4200').split(',').map((o) => o.trim()),
  });

  const config = new DocumentBuilder()
    .setTitle('Hojas de personaje 5e — API')
    .setDescription('API REST para crear y gestionar hojas de personaje compatibles con la 5.ª edición.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
