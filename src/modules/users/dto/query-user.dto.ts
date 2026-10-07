import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Usergroup ID' })
  @IsUUID()
  @IsOptional()
  usergroupId?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'], description: 'Filter by active status' })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'], description: 'Filter by locked status' })
  @IsString()
  @IsOptional()
  isLocked?: string;
}
