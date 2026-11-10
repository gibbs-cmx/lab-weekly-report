import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsOptional, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
  @ApiProperty({
    example: "test1234",
    description: "현재 비밀번호 (첫 로그인 시 생략 가능)",
  })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({
    example: "NewPass1!",
    description: "새 비밀번호 (8자 이상, 영문 대문자·소문자·숫자·특수문자 중 3종 이상 조합)",
  })
  @IsString()
  @MinLength(8, { message: "비밀번호는 8자 이상이어야 합니다" })
  @Matches(
    /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])|(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])|(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])).{8,}$/,
    {
      message: "영문 대문자, 소문자, 숫자, 특수문자 중 3종 이상을 조합해야 합니다",
    },
  )
  newPassword: string;
}
