import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("Exception");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "서버 내부 오류가 발생했습니다";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      message =
        typeof response === "string"
          ? response
          : (response as Record<string, unknown>).message
            ? String((response as Record<string, unknown>).message)
            : exception.message;
    } else if (exception instanceof Error) {
      // Prisma 에러 처리
      const prismaCode = (exception as Error & { code?: string }).code;
      if (prismaCode === "P2002") {
        status = HttpStatus.CONFLICT;
        message = "이미 존재하는 데이터입니다";
      } else if (prismaCode === "P2025") {
        status = HttpStatus.NOT_FOUND;
        message = "데이터를 찾을 수 없습니다";
      } else {
        this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
      }
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
