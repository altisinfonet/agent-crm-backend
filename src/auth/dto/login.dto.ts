import { ApiProperty } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    ValidateIf,
    IsIn,
    IsEmail,
} from 'class-validator';

export class LoginDto {
    @IsString()
    @IsIn(['email_pw', 'email_otp', 'phone_otp', 'google', 'apple'])
    @ApiProperty({ example: 'email_pw', enum: ['email_pw', 'email_otp', 'phone_otp', 'google', 'apple'] })
    auth_type: string;

    // ------------------------------
    // EMAIL PASSWORD LOGIN
    // ------------------------------
    @ValidateIf(o => o.auth_type === 'email_pw')
    @IsEmail()
    @ApiProperty({ example: 'user@example.com', required: false })
    email?: string;

    @ValidateIf(o => o.auth_type === 'email_pw')
    @IsString()
    @ApiProperty({ example: 'user-password', required: false })
    password?: string;

    // ------------------------------
    // OTP LOGIN (email or phone)
    // ------------------------------
    @ValidateIf(o => o.auth_type === 'email_otp' || o.auth_type === 'phone_otp')
    @ApiProperty({ example: '9876543210', required: false })
    @IsString()
    destination?: string;

    @ValidateIf(o => o.auth_type === 'email_otp' || o.auth_type === 'phone_otp')
    @ApiProperty({ example: '123456', required: false })
    @IsString()
    otp?: string;

    @ValidateIf(o => o.auth_type === 'email_otp' || o.auth_type === 'phone_otp')
    @IsString()
    @ApiProperty({ example: 'uuid-delivery-id', required: false })
    delivery_id?: string;

    // ------------------------------
    // SOCIAL LOGIN
    // ------------------------------
    @ValidateIf(o => o.auth_type === 'google' || o.auth_type === 'apple')
    @IsString()
    @ApiProperty({ example: 'google-id-token', required: false })
    id_token?: string;
}
