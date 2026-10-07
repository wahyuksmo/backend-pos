import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryPasswordPolicyDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by policy code' })
  @IsString()
  @IsOptional()
  code?: string;
}
