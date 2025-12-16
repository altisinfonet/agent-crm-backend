import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
    @IsString()
    @IsNotEmpty()
    credential: string;

    @IsBoolean()
    is_email: boolean;
}