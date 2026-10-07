import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryUserGroupDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by usergroup code' })
  @IsString()
  @IsOptional()
  usergroupCode?: string;

  @ApiPropertyOptional({ description: 'Filter by usergroup name' })
  @IsString()
  @IsOptional()
  usergroupName?: string;
}
