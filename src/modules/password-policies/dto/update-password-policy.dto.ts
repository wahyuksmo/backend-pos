import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePasswordPolicyDto {
  @ApiProperty({ example: '8', description: 'Rule configuration value (e.g. min length or 1/0 for boolean)' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ example: 'Password must have at least 8 characters' })
  @IsString()
  @IsOptional()
  message?: string;
}
