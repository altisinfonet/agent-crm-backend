import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as  express from 'express';
import { ExpressAdapter } from '@nestjs/platform-express';

const port = process.env.PORT || 6969
const expressApp = express();

expressApp.use(
  '/api/v1/subscription/webhook',
  express.raw({ type: 'application/json' })
);


async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
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
    origin: process.env.WEB_BASE_PATH || 'http://192.168.1.101:3000',
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('FinMitra API')
    .setDescription('API documentation for FinMitra backend')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, () => {
    console.log(`Server running on -> http://192.168.1.101:${port}`);
    console.log(`Swagger -> http://192.168.1.101:${port}/api/docs`);
  });
}
bootstrap();
