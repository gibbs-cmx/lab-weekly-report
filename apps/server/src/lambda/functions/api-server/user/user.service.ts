import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

import { PrismaService } from "../prisma/prisma.service";

import { toUserResponse } from "./user.mapper";

export interface CreateUserInput {
  email: string;
  name: string;
  role?: "ADMIN" | "MEMBER";
  department?: string;
  position?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, "email">> & { isActive?: boolean };

/** 임시 비밀번호 — 12자, 영문 대소문자/숫자/-_ */
function generateTempPassword(): string {
  return randomBytes(9).toString("base64url");
}

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("사용자를 찾을 수 없습니다");
    return toUserResponse(user);
  }

  async list(filter: { includeInactive?: boolean } = {}) {
    const where: Prisma.UserWhereInput = filter.includeInactive ? {} : { isActive: true };
    const users = await this.prisma.user.findMany({
      where,
      orderBy: [{ department: "asc" }, { name: "asc" }],
    });
    return users.map(toUserResponse);
  }

  /** 사용자 생성 — 임시 비밀번호를 응답으로 1회만 반환 (첫 로그인 시 변경 강제) */
  async create(input: CreateUserInput) {
    const tempPassword = generateTempPassword();
    const user = await this.prisma.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        name: input.name.trim(),
        role: input.role ?? "MEMBER",
        department: input.department?.trim() ?? "",
        position: input.position?.trim() ?? "",
        passwordHash: await hash(tempPassword, 10),
      },
    });
    return { user: toUserResponse(user), tempPassword };
  }

  async update(id: number, input: UpdateUserInput) {
    await this.getById(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        role: input.role,
        department: input.department?.trim(),
        position: input.position?.trim(),
        isActive: input.isActive,
      },
    });
    return toUserResponse(user);
  }

  /** 비밀번호 초기화 + 잠금 해제 */
  async resetPassword(id: number) {
    await this.getById(id);
    const tempPassword = generateTempPassword();
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hash(tempPassword, 10),
        passwordChanged: false,
        failedLoginCount: 0,
      },
    });
    return { tempPassword };
  }
}
