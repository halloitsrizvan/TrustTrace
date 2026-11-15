import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = this.toBody(exception, status);

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} failed`);
    }

    response.status(status).json(body);
  }

  private toBody(exception: unknown, statusCode: number): ErrorBody {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode,
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return { statusCode, message: response, error: exception.name };
    }

    const payload = response as Record<string, unknown>;
    return {
      statusCode,
      message:
        typeof payload.message === 'string' || Array.isArray(payload.message)
          ? (payload.message as string | string[])
          : exception.message,
      error:
        typeof payload.error === 'string' ? payload.error : exception.name,
    };
  }
}
