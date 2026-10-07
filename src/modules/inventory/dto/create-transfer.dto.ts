import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';

export class CreateTransferItemDto {
  @ApiProperty({ description: 'ID Produk' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiPropertyOptional({ description: 'ID Varian Produk (opsional)' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Jumlah kuantiti barang yang ditransfer' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiPropertyOptional({ description: 'Catatan item transfer' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateTransferDto {
  @ApiProperty({ description: 'ID Gudang asal pengiriman' })
  @IsNotEmpty()
  @IsString()
  fromWarehouseId: string;

  @ApiProperty({ description: 'ID Gudang tujuan penerima' })
  @IsNotEmpty()
  @IsString()
  toWarehouseId: string;

  @ApiPropertyOptional({ description: 'Catatan / instruksi pengiriman transfer' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateTransferItemDto], description: 'Daftar item yang ditransfer' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransferItemDto)
  items: CreateTransferItemDto[];
}

export class UpdateTransferStatusDto {
  @ApiProperty({ description: 'Status baru (APPROVED, SHIPPED, RECEIVED, CANCELLED)' })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Catatan update status' })
  @IsOptional()
  @IsString()
  notes?: string;
}
