import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const port = process.env.PORT || 6969
const expressApp = express();
async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI, // adds `/v1`
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formatted = errors.map(err => ({
          field: err.property,
          errors: Object.values(err.constraints || {}),
        }));

        return {
          message: 'Validation failed',
          errors: formatted,
        };
      },
    }),
  );

  app.enableCors({
    // origin: true,
    origin: process.env.FRONTEND_URL || 'http://192.168.1.101:3030',
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Agent CRM Authentication API')
    .setDescription('API documentation for SaaS CRM Auth module')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port, () => {
    console.log(`Server running on -> http://192.168.1.101:${port}`);
  });
}
bootstrap();
