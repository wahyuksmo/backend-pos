import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserGroupDto {
  @ApiPropertyOptional({ example: 'HR_MANAGER' })
  @IsString()
  @IsOptional()
  usergroupCode?: string;

  @ApiPropertyOptional({ example: 'HR Department Manager' })
  @IsString()
  @IsOptional()
  usergroupName?: string;
}
