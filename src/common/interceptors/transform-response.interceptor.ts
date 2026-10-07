import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto';

@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, ApiResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponseDto<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((result) => {
        // If result is already formatted
        if (result && typeof result === 'object' && ('data' in result || 'message' in result)) {
          return {
            statusCode,
            success: true,
            message: result.message || 'Operation successful',
            data: result.data !== undefined ? result.data : result,
            meta: result.meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          statusCode,
          success: true,
          message: 'Operation successful',
          data: result,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
