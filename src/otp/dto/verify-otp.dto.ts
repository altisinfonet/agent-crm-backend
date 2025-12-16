import { PartialType } from '@nestjs/mapped-types';
import { SendOtpDto } from './send-otp.dto';
import { IsNotEmpty, IsString } from 'class-validator';

export class verifyOtpDto extends PartialType(SendOtpDto) {

    @IsNotEmpty()
    @IsString()
    otp: string

}
