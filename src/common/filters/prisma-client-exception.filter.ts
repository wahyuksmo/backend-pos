import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';

    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        message = `Unique constraint violation on field(s): ${target.join(', ') || 'field'}`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = (exception.meta?.cause as string) || 'Record not found';
        break;
      }
      case 'P2003': {
        status = HttpStatus.BAD_REQUEST;
        const fieldName = (exception.meta?.field_name as string) || 'foreign key';
        message = `Foreign key constraint failed on: ${fieldName}`;
        break;
      }
      default:
        this.logger.error(`Prisma error ${exception.code}: ${exception.message}`, exception.stack);
        message = `Database operation failed: ${exception.message}`;
        break;
    }

    response.status(status).json({
      statusCode: status,
      success: false,
      message,
      errorCode: exception.code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
