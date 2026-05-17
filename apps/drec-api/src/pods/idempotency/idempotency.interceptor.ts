import {
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as crypto from 'crypto';
import { IdempotencyKeyEntity } from './idempotency-key.entity';

/**
 * Opt-in interceptor: decorate a controller route with
 * `@UseInterceptors(IdempotencyInterceptor)` and any request that
 * carries an `Idempotency-Key` header will be deduplicated against
 * earlier requests with the same (key, organizationId).
 *
 * Requests without the header are passed through untouched. That
 * preserves the current behavior for any callers (cURL, integrators,
 * old UI tabs) that haven't been updated to send the header.
 *
 * The interceptor runs after authentication (so `req.user` is set)
 * but before the controller body executes, which is the only place
 * we can both inspect the user context and short-circuit the response.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);

  constructor(
    @InjectRepository(IdempotencyKeyEntity)
    private readonly repo: Repository<IdempotencyKeyEntity>,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const req = context.switchToHttp().getRequest();
    const key: string | undefined = req.headers['idempotency-key'];
    if (!key) return next.handle();

    const user = req.user;
    const organizationId: number | undefined = user?.organizationId;
    if (!organizationId) {
      // Without an org we can't scope the key. Rather than guess, let
      // the request through — auth will reject it if it's truly anon.
      return next.handle();
    }

    const endpoint = `${req.method} ${req.route?.path ?? req.path}`;
    const requestHash = this.hashRequest(req);

    const existing = await this.repo.findOne({
      where: { key, organizationId },
    });

    if (existing) {
      if (existing.endpoint !== endpoint) {
        // Reusing the same key against a different endpoint is almost
        // certainly a client bug. Refuse rather than serve the wrong
        // response.
        throw new ConflictException(
          `Idempotency-Key was previously used for ${existing.endpoint}; ` +
            `cannot reuse for ${endpoint}`,
        );
      }
      if (existing.requestHash !== requestHash) {
        // Same key + same endpoint + different body. Log loudly,
        // return the original response (Stripe semantics).
        this.logger.warn(
          `Idempotency-Key ${key} replayed with different body on ${endpoint}; ` +
            'returning cached response',
        );
      }
      if (existing.completedAt == null) {
        // Original is still in flight. Don't double-process; signal
        // the client to back off and retry shortly.
        throw new ConflictException(
          'Request with this Idempotency-Key is still processing',
        );
      }
      // Replay the cached response. Setting the status header keeps
      // the caller's understanding consistent (e.g. 201 stays 201).
      context.switchToHttp().getResponse().status(existing.statusCode ?? 200);
      return of(existing.responseBody);
    }

    // Reserve the key first so a concurrent retry sees the in-flight
    // row and 409s instead of racing into the handler.
    try {
      await this.repo.insert({
        key,
        organizationId,
        endpoint,
        requestHash,
        statusCode: null,
        responseBody: null,
        completedAt: null,
      });
    } catch (err: any) {
      // PG 23505 unique_violation — another request just reserved the
      // key. Treat as a duplicate-in-flight to keep semantics simple.
      if (err?.code === '23505') {
        throw new ConflictException(
          'Request with this Idempotency-Key is still processing',
        );
      }
      throw err;
    }

    return next.handle().pipe(
      tap(async (body) => {
        const statusCode =
          context.switchToHttp().getResponse().statusCode ?? 200;
        await this.repo.update(
          { key, organizationId },
          {
            statusCode,
            responseBody: body ?? null,
            completedAt: new Date(),
          },
        );
      }),
      catchError((err) => {
        // On error: drop the reservation so the client can legitimately
        // retry the operation rather than getting locked out for 24h.
        this.repo.delete({ key, organizationId }).catch((delErr) =>
          this.logger.error(
            `Failed to release idempotency key after handler error: ${delErr.message}`,
          ),
        );
        return throwError(() => err);
      }),
    );
  }

  /** Canonicalize request to detect "same key, different body" replays.
   *  For multipart we hash the parsed `body` only — file buffers vary
   *  by upload framing and aren't worth hashing for replay-detection
   *  purposes. The point isn't security, it's a sanity warning. */
  private hashRequest(req: any): string {
    let payload: string;
    try {
      payload = JSON.stringify(req.body ?? {});
    } catch {
      payload = String(req.body ?? '');
    }
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}
