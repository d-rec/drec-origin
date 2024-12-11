import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WithSentry } from '@sentry/nestjs';
import { ArgumentsHost } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  @WithSentry()
  catch(exception: Error | HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

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
        message: exception.message || 'Internal server error',
      };
    }

    // Log the error
    this.logger.error({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: errorResponse,
      stack: exception.stack,
      environment: process.env.NODE_ENV,
    });

    // Send the response
    response.status(status).json(errorResponse);
  }
}
