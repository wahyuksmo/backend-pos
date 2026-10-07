import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryMenuDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Parent Menu ID' })
  @IsUUID()
  @IsOptional()
  pid?: string;

  @ApiPropertyOptional({ description: 'Filter by Menu Name' })
  @IsString()
  @IsOptional()
  menuName?: string;

  @ApiPropertyOptional({ description: 'Filter by Menu Title' })
  @IsString()
  @IsOptional()
  menuTitle?: string;
}
