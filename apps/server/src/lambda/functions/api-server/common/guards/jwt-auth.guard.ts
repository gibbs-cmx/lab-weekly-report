import { ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import type { AuthUser } from "../auth-user";

const CHANGE_PASSWORD_PATH = "/auth/change-password";

/**
 * JWT 인증 가드.
 * 임시 비밀번호 상태(최초 로그인·초기화 직후)의 토큰은 비밀번호 변경 API 만 통과시킨다.
 * 개발 편의: NODE_ENV !== "production" 이고 DEV_MAGIC_TOKEN 이 설정되어 있으면
 * `Authorization: Bearer <DEV_MAGIC_TOKEN>` 으로 id=1 ADMIN 권한 통과 (Swagger/curl 테스트용).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    const magic = process.env.DEV_MAGIC_TOKEN;
    if (magic && process.env.NODE_ENV !== "production") {
      const req = context.switchToHttp().getRequest<{
        headers: Record<string, string | undefined>;
        user?: AuthUser;
      }>();
      const token = req.headers.authorization?.replace("Bearer ", "");
      if (token === magic) {
        req.user = { id: 1, email: "dev@lab.local", role: "ADMIN", name: "DEV" };
        return true;
      }
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = AuthUser>(
    err: unknown,
    user: AuthUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    const authed = super.handleRequest<AuthUser>(err, user, info, context);
    if (authed.mustChangePassword) {
      const { url } = context.switchToHttp().getRequest<{ url: string }>();
      if (!url.split("?")[0].endsWith(CHANGE_PASSWORD_PATH)) {
        throw new ForbiddenException("비밀번호를 먼저 변경해주세요");
      }
    }
    return authed as TUser;
  }
}
