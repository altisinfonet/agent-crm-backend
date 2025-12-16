import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed/seed.module';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(SeedModule);
    const seeder = app.get(SeedService);
    await seeder.seed();
    await app.close();
}

bootstrap();
