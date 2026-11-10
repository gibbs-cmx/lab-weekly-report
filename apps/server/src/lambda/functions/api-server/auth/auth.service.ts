import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "@prisma/client";
import { compare, hash } from "bcryptjs";

import { PrismaService } from "../prisma/prisma.service";
import { toUserResponse } from "../user/user.mapper";

import type { JwtPayload } from "./jwt.strategy";

export const MAX_FAILED_LOGIN = 5;
const INVALID_CREDENTIALS = "이메일 또는 비밀번호가 올바르지 않습니다";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    if (user.failedLoginCount >= MAX_FAILED_LOGIN) {
      throw new UnauthorizedException("계정이 잠겼습니다. 관리자에게 문의하세요.");
    }

    const ok = await compare(password, user.passwordHash);
    if (!ok) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lastLoginAt: new Date() },
    });

    return { accessToken: this.signToken(user), user: toUserResponse(user) };
  }

  private signToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      pwc: user.passwordChanged,
    };
    return this.jwtService.sign(payload);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException("사용자를 찾을 수 없습니다");

    // 첫 로그인(임시 비밀번호)이면 현재 비밀번호 검증 생략
    if (user.passwordChanged && !(await compare(currentPassword, user.passwordHash))) {
      throw new BadRequestException("현재 비밀번호가 올바르지 않습니다");
    }
    if (await compare(newPassword, user.passwordHash)) {
      throw new BadRequestException("현재 비밀번호와 다른 비밀번호를 입력해주세요");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hash(newPassword, 10), passwordChanged: true },
    });
    // 임시 비밀번호 토큰은 다른 API 가 막혀 있으므로, 변경 직후 정식 토큰을 새로 내려준다
    return { message: "비밀번호가 변경되었습니다", accessToken: this.signToken(updated) };
  }
}
