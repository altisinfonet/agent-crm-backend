import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';
import { registerHandlebarsHelpers } from '@/common/helper/handlebars.helper';

registerHandlebarsHelpers();

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST'),
                    port: config.get<string>('MAIL_PORT'),
                    secure: config.get('MAIL_PORT') === '465',
                    // service: "gmail",
                    auth: {
                        user: config.get<string>('MAIL_USER'),
                        pass: config.get<string>('MAIL_PASS')
                    }
                },
                defaults: {
                    from: config.get<string>('MAIL_FROM')
                },
                template: {
                    dir: join(__dirname, 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }
