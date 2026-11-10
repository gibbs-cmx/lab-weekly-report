import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import type { AuthUser } from "../common/auth-user";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";

import { UserService } from "./user.service";

@ApiTags("사용자 - 내 정보")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UserController {
  constructor(private userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "내 정보" })
  getMe(@CurrentUser() user: AuthUser) {
    return this.userService.getById(user.id);
  }
}
