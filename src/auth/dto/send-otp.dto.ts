import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOtpDto {
    @IsString()
    @ApiProperty({ example: 'email_otp' })
    auth_type: 'email_otp' | 'phone_otp';

    @IsString()
    @ApiProperty({ example: 'user@example.com' })
    destination: string;

    @IsString()
    @IsIn(['email', 'sms', 'whatsapp'])
    @ApiProperty({ example: 'sms', enum: ['email', 'sms', 'whatsapp'] })
    channel: string;
}
