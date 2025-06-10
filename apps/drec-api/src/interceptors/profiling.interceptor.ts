import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RequestProfiler } from '../request-profiler';

@Injectable()
export class ProfilingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    return RequestProfiler.run(route, () =>
      next.handle().pipe(tap(() => console.log('\n📊 Request Completed'))),
    );
  }
}
