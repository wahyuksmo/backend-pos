import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductionMaterialItemDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-345678901234', description: 'ID Produk Bahan Baku' })
  @IsUUID('4', { message: 'productId bahan baku harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Bahan baku wajib dipilih' })
  productId: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', description: 'ID Varian Produk (opsional)' })
  @IsOptional()
  @IsUUID('4')
  variantId?: string | null;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-def0-456789012345', description: 'ID Satuan' })
  @IsOptional()
  @IsUUID('4')
  unitId?: string | null;

  @ApiPropertyOptional({ example: 10, description: 'Estimasi takaran BOM' })
  @IsOptional()
  @IsNumber()
  bomQuantity?: number;

  @ApiProperty({ example: 10.5, description: 'Qty aktual bahan yang dipakai' })
  @IsNumber()
  @Min(0.0001, { message: 'Qty aktual bahan harus lebih besar dari 0' })
  actualQuantity: number;

  @ApiPropertyOptional({ example: 5000, description: 'HPP Satuan bahan' })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ example: 'Sedikit tumpah saat menakar' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProductionDto {
  @ApiProperty({ example: 'w1e2r3t4-y5u6-7890-abcd-ef1234567890', description: 'ID Gudang / Kitchen Produksi' })
  @IsUUID('4', { message: 'warehouseId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Gudang produksi wajib dipilih' })
  warehouseId: string;

  @ApiProperty({ example: 'p1r2o3d4-u5c6-7890-abcd-ef1234567890', description: 'ID Produk Menu Jadi' })
  @IsUUID('4', { message: 'productId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Produk menu jadi wajib dipilih' })
  productId: string;

  @ApiPropertyOptional({ example: 'v1a2r3i4-a5n6-7890-abcd-ef1234567890', description: 'ID Varian Menu (opsional)' })
  @IsOptional()
  @IsUUID('4')
  variantId?: string | null;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-def0-456789012345', description: 'ID Satuan Hasil Jadi' })
  @IsOptional()
  @IsUUID('4')
  unitId?: string | null;

  @ApiProperty({ example: 10, description: 'Target Qty produksi' })
  @IsNumber()
  @Min(0.0001, { message: 'Target Qty harus lebih besar dari 0' })
  targetQuantity: number;

  @ApiProperty({ example: 10, description: 'Aktual Qty produk jadi yang dihasilkan' })
  @IsNumber()
  @Min(0.0001, { message: 'Aktual Qty harus lebih besar dari 0' })
  actualQuantity: number;

  @ApiPropertyOptional({ example: '2026-10-05T10:00:00.000Z', description: 'Tanggal Produksi' })
  @IsOptional()
  @IsDateString()
  productionDate?: string;

  @ApiPropertyOptional({ example: 'Batch produksi pagi untuk jam makan siang' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ProductionMaterialItemDto], description: 'Daftar bahan baku yang dikonsumsi' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Minimal harus ada 1 bahan baku yang dikonsumsi' })
  @ValidateNested({ each: true })
  @Type(() => ProductionMaterialItemDto)
  materials: ProductionMaterialItemDto[];
}
