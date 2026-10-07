import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateAdjustmentItemDto {
  @ApiProperty({ description: 'ID Produk' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'ID Varian Produk (opsional)' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Kuantiti fisik aktual hasil hitung opname' })
  @IsNotEmpty()
  @IsNumber()
  actualQuantity: number;

  @ApiPropertyOptional({ description: 'Catatan per item' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateAdjustmentDto {
  @ApiProperty({ description: 'ID Gudang yang di-opname' })
  @IsNotEmpty()
  @IsString()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Alasan penyesuaian (OPNAME, DAMAGED, EXPIRED, LOST, OTHER)', default: 'OPNAME' })
  @IsOptional()
  @IsString()
  reason?: string = 'OPNAME';

  @ApiPropertyOptional({ description: 'Catatan berita acara penyesuaian' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateAdjustmentItemDto], description: 'Daftar item opname' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAdjustmentItemDto)
  items: CreateAdjustmentItemDto[];
}
