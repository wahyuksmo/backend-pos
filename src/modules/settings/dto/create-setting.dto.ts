import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSettingDto {
  @ApiProperty({ description: 'Setting key identifier' })
  @IsString()
  @IsNotEmpty()
  settingKey: string;

  @ApiProperty({ description: 'Setting value content' })
  @IsString()
  @IsNotEmpty()
  settingValue: string;

  @ApiPropertyOptional({ description: 'Value data type (string, number, boolean, json)', default: 'string' })
  @IsString()
  @IsOptional()
  valueType?: string;

  @ApiPropertyOptional({ description: 'Setting description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Associated system object code', default: 'SETTING' })
  @IsString()
  @IsOptional()
  objectCode?: string;
}

