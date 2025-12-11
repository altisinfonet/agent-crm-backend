import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable global validation with custom error formatter
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

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Agent CRM Authentication API')
    .setDescription('API documentation for SaaS CRM Auth module')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
