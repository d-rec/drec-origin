import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    Sentry.captureException(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorResponse: any;

    if (exception instanceof HttpException) {
      errorResponse = exception.getResponse();
    } else {
      errorResponse = {
        statusCode: status,
        message:
          exception instanceof Error
            ? exception.message
            : 'Internal server error',
      };
    }

    response.status(status).json(errorResponse);
  }
}
