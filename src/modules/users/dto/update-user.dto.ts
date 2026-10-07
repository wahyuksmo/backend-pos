import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Johnathan Doe' })
  @IsString()
  @IsOptional()
  fullname?: string;

  @ApiPropertyOptional({ example: 'john.doe@enterprise.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'New password if updating' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'Usergroup ID (UUID)' })
  @IsUUID()
  @IsOptional()
  usergroupId?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsString()
  @IsOptional()
  isLocked?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsString()
  @IsOptional()
  needResetPassword?: string;
}
