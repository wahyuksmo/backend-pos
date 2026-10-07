import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({ example: { total: 100, page: 1, limit: 10, totalPages: 10 } })
  meta?: Record<string, any>;

  @ApiProperty({ example: '2026-09-28T04:00:00.000Z' })
  timestamp: string;
}
