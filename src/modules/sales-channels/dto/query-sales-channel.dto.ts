import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QuerySalesChannelDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Pencarian kode / nama channel' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter order type (DINE_IN, TAKEAWAY, DELIVERY)' })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ description: 'Filter status aktif (Y/N)' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ default: 'channelCode' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'channelCode';

  @ApiPropertyOptional({ default: 'asc', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
