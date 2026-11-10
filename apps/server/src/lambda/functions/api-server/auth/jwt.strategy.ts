import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

import type { AuthUser } from "../common/auth-user";

export interface JwtPayload {
  sub: number;
  email: string;
  role: AuthUser["role"];
  name: string;
  /** 비밀번호 변경 여부 (password changed). false 면 임시 비밀번호 상태 — 변경 API 외에는 차단 */
  pwc?: boolean;
}

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다");
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
      mustChangePassword: payload.pwc === false,
    };
  }
}
