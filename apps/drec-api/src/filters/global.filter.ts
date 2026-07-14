import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ArgumentsHost,
} from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  @SentryExceptionCaptured()
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

    // NestJS's multer integration transforms Multer upload errors into
    // HttpExceptions carrying only the terse multer text (e.g.
    // "Unexpected field") and drops the offending field. Rewrite those
    // into actionable guidance so the caller understands what to fix.
    errorResponse = this.enrichMulterMessage(errorResponse);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      // Log the error
      this.logger.error({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        error: errorResponse,
        stack: exception.stack,
        environment: process.env.NODE_ENV,
      });
    }

    // Send the response
    response.status(status).json(errorResponse);
  }

  /** Rewrite NestJS-wrapped Multer error messages into actionable text.
   *  The exception body looks like { statusCode, message, error }; only
   *  the `message` is touched, and only when it matches a known terse
   *  Multer string. Everything else passes through unchanged. */
  private enrichMulterMessage(errorResponse: any): any {
    const raw =
      typeof errorResponse === 'string'
        ? errorResponse
        : errorResponse?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    if (typeof message !== 'string') return errorResponse;

    const detail = this.MULTER_MESSAGE_DETAIL[message];
    if (!detail) return errorResponse;

    if (typeof errorResponse === 'string') return detail;
    return { ...errorResponse, message: detail };
  }

  /** Terse Multer strings (as re-thrown by @nestjs/platform-express)
   *  mapped to guidance a registrant can act on. Field-specific detail
   *  isn't available here — NestJS drops Multer's `.field` during the
   *  transform — so the client caps per slot and names the exact one. */
  private readonly MULTER_MESSAGE_DETAIL: Record<string, string> = {
    'Unexpected field':
      'Too many files for one document type, or a document type that this ' +
      'endpoint does not accept. Each type allows at most 10 files (20 for ' +
      'Metering Evidence and Other Documents) — reduce the count on the ' +
      'over-filled slot and retry.',
    'File too large': 'A file exceeds the maximum allowed upload size (20MB).',
    'Too many files': 'Too many files were uploaded in a single request.',
    'Too many parts': 'The upload contained too many parts.',
    'Too many fields': 'The upload contained too many form fields.',
  };
}
