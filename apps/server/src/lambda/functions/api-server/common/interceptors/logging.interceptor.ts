import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { Observable, tap, catchError, throwError } from "rxjs";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, body } = req;
    const userAgent = req.get("user-agent") || "";
    const userId = (req as unknown as { user?: { id?: number } }).user?.id;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const duration = Date.now() - start;
        this.logger.log(
          `${method} ${url} ${res.statusCode} ${duration}ms` +
            (userId ? ` [user:${userId}]` : "") +
            (userAgent ? ` ${userAgent.slice(0, 50)}` : ""),
        );
      }),
      catchError((err) => {
        const duration = Date.now() - start;
        const status = err?.status || err?.getStatus?.() || 500;
        this.logger.error(
          `${method} ${url} ${status} ${duration}ms` +
            (userId ? ` [user:${userId}]` : "") +
            ` ERR: ${err?.message || err}`,
        );
        if (method === "POST" && status >= 400) {
          this.logger.debug(`Body: ${(JSON.stringify(body) ?? "").slice(0, 500)}`);
        }
        return throwError(() => err);
      }),
    );
  }
}
