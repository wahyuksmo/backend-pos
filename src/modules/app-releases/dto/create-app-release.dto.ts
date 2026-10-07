import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateAppReleaseDto {
  @ApiProperty({ example: '1.0.0', description: 'Versi aplikasi (semantic version)' })
  @IsString()
  @IsNotEmpty({ message: 'Versi aplikasi wajib diisi' })
  versionName: string;

  @ApiPropertyOptional({ example: 1, description: 'Kode build aplikasi (integer incremental)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  versionCode?: number;

  @ApiPropertyOptional({ example: 'Rilis awal fitur POS kasir', description: 'Catatan perubahan / changelog' })
  @IsString()
  @IsOptional()
  releaseNotes?: string;

  @ApiPropertyOptional({ example: 'Y', description: 'Tandai sebagai versi rilis terbaru (Y/N)', default: 'Y' })
  @IsString()
  @IsOptional()
  isLatest?: string = 'Y';

  @ApiPropertyOptional({ example: 'Y', description: 'Status aktif (Y/N)', default: 'Y' })
  @IsString()
  @IsOptional()
  isActive?: string = 'Y';
}
