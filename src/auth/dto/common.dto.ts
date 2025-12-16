import { IsNotEmpty, IsString } from "class-validator";

export class CommonDto {
    @IsString()
    @IsNotEmpty()
    data: string;
}
