import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBrandDto {
  @ApiProperty({ example: 'BRD-NES', description: 'Kode merek' })
  @IsNotEmpty({ message: 'Kode merek wajib diisi' })
  @IsString()
  brandCode: string;

  @ApiProperty({ example: 'Nestle', description: 'Nama merek' })
  @IsNotEmpty({ message: 'Nama merek wajib diisi' })
  @IsString()
  brandName: string;

  @ApiPropertyOptional({ example: 'Produk makanan & minuman global' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
