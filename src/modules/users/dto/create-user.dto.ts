import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe', description: 'Unique username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name of user' })
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @ApiPropertyOptional({ example: 'john.doe@enterprise.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+628123456789' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'SecretP@ssword123', description: 'User initial password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Usergroup ID (UUID)' })
  @IsUUID()
  @IsOptional()
  usergroupId?: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'Y' })
  @IsString()
  @IsOptional()
  isActive?: string;
}
