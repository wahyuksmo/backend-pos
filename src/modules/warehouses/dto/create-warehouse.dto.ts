import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWarehouseDto {
  @ApiPropertyOptional({ description: 'ID outlet cabang terkait (opsional jika gudang sentral)' })
  @IsOptional()
  @IsUUID('4', { message: 'ID outlet harus berformat UUID' })
  outletId?: string;

  @ApiProperty({ example: 'GDG-PST', description: 'Kode unik gudang' })
  @IsNotEmpty({ message: 'Kode gudang wajib diisi' })
  @IsString()
  warehouseCode: string;

  @ApiProperty({ example: 'Gudang Pusat Logistik', description: 'Nama gudang' })
  @IsNotEmpty({ message: 'Nama gudang wajib diisi' })
  @IsString()
  warehouseName: string;

  @ApiPropertyOptional({ example: 'GENERAL', description: 'Jenis gudang (GENERAL, KITCHEN, BAR)' })
  @IsOptional()
  @IsString()
  warehouseType?: string = 'GENERAL';

  @ApiPropertyOptional({ example: 'Kawasan Industri Pulogadung Blok B' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Y', description: 'Gudang utama (Y/N)' })
  @IsOptional()
  @IsString()
  isDefault?: string = 'N';

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
