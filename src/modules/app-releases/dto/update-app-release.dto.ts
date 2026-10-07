import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAppReleaseDto {
  @ApiPropertyOptional({ example: '1.0.1', description: 'Versi aplikasi' })
  @IsString()
  @IsOptional()
  versionName?: string;

  @ApiPropertyOptional({ example: 2, description: 'Kode build aplikasi' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  versionCode?: number;

  @ApiPropertyOptional({ example: 'Perbaikan bug cetak struk', description: 'Catatan perubahan' })
  @IsString()
  @IsOptional()
  releaseNotes?: string;

  @ApiPropertyOptional({ example: 'Y', description: 'Tandai sebagai versi rilis terbaru (Y/N)' })
  @IsString()
  @IsOptional()
  isLatest?: string;

  @ApiPropertyOptional({ example: 'Y', description: 'Status aktif (Y/N)' })
  @IsString()
  @IsOptional()
  isActive?: string;
}
