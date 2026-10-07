import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'CAT-BEV', description: 'Kode kategori produk' })
  @IsNotEmpty({ message: 'Kode kategori wajib diisi' })
  @IsString()
  categoryCode: string;

  @ApiProperty({ example: 'Minuman & Kopi', description: 'Nama kategori produk' })
  @IsNotEmpty({ message: 'Nama kategori wajib diisi' })
  @IsString()
  categoryName: string;

  @ApiPropertyOptional({ description: 'ID kategori induk (hierarki)' })
  @IsOptional()
  @IsUUID('4', { message: 'ID parent category harus berformat UUID' })
  parentCategoryId?: string;

  @ApiPropertyOptional({ example: 'Coffee', description: 'Nama icon Lucide' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Kode warna kategori' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 1, default: 0, description: 'Urutan tampilan' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number = 0;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
