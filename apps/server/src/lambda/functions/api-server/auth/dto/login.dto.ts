import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({ example: "member1@lab.local" })
  @IsEmail({}, { message: "이메일 형식이 올바르지 않습니다" })
  email: string;

  @ApiProperty({ example: "test1234" })
  @IsString()
  password: string;
}
