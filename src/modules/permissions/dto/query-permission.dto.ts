import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryPermissionDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Usergroup ID' })
  @IsUUID()
  @IsOptional()
  usergroupId?: string;

  @ApiPropertyOptional({ description: 'Filter by Menu ID' })
  @IsUUID()
  @IsOptional()
  menuId?: string;
}
