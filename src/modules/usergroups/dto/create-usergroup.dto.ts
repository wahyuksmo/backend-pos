import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserGroupDto {
  @ApiProperty({ example: 'HR_MANAGER', description: 'Unique code for usergroup/role' })
  @IsString()
  @IsNotEmpty()
  usergroupCode: string;

  @ApiProperty({ example: 'HR Department Manager', description: 'Descriptive name for usergroup' })
  @IsString()
  @IsNotEmpty()
  usergroupName: string;
}
