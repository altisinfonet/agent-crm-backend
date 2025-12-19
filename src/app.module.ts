import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailService } from './mail/mail.service';
import { OtpModule } from './otp/otp.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    OtpModule,
    UserModule,
    ProductsModule
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule { }
