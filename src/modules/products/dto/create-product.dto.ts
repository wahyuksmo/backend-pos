import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'VAR-S', description: 'Kode unik varian' })
  @IsNotEmpty({ message: 'Kode varian wajib diisi' })
  @IsString()
  variantCode: string;

  @ApiProperty({ example: 'Ukuran Small', description: 'Nama varian' })
  @IsNotEmpty({ message: 'Nama varian wajib diisi' })
  @IsString()
  variantName: string;

  @ApiPropertyOptional({ example: 'SKU-VAR-S' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: '899123456001' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 10000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number = 0;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellingPrice?: number = 0;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string = 'Y';
}

export class CreateProductOutletPriceDto {
  @ApiProperty({ description: 'ID Outlet cabang' })
  @IsNotEmpty({ message: 'Outlet wajib dipilih' })
  @IsUUID('4')
  outletId: string;

  @ApiPropertyOptional({ description: 'ID Varian (opsional)' })
  @IsOptional()
  @IsUUID('4')
  variantId?: string;

  @ApiProperty({ example: 18000, description: 'Harga jual khusus outlet' })
  @IsNotEmpty({ message: 'Harga jual outlet wajib diisi' })
  @Type(() => Number)
  @IsNumber()
  sellingPrice: number;
}

export class CreateModifierItemDto {
  @ApiProperty({ example: 'Extra Shot Espresso', description: 'Nama item modifier' })
  @IsNotEmpty({ message: 'Nama item modifier wajib diisi' })
  @IsString()
  itemName: string;

  @ApiPropertyOptional({ example: 5000, description: 'Biaya tambahan' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extraPrice?: number = 0;
}

export class CreateModifierGroupDto {
  @ApiProperty({ example: 'Topping & Add-ons', description: 'Nama grup modifier' })
  @IsNotEmpty({ message: 'Nama grup modifier wajib diisi' })
  @IsString()
  groupName: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minSelect?: number = 0;

  @ApiPropertyOptional({ example: 3, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxSelect?: number = 1;

  @ApiPropertyOptional({ example: 'N', description: 'Wajib memilih (Y/N)' })
  @IsOptional()
  @IsString()
  isRequired?: string = 'N';

  @ApiPropertyOptional({ type: () => [CreateModifierItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierItemDto)
  items?: CreateModifierItemDto[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'PRD-001', description: 'Kode produk unik' })
  @IsNotEmpty({ message: 'Kode produk wajib diisi' })
  @IsString()
  productCode: string;

  @ApiPropertyOptional({ example: '899999900001' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({ example: 'Kopi Susu Gula Aren', description: 'Nama produk' })
  @IsNotEmpty({ message: 'Nama produk wajib diisi' })
  @IsString()
  productName: string;

  @ApiPropertyOptional({ example: 'STANDARD', enum: ['STANDARD', 'VARIANT', 'COMBO', 'SERVICE'] })
  @IsOptional()
  @IsString()
  productType?: string = 'STANDARD';

  @ApiPropertyOptional({ description: 'ID kategori produk' })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({ description: 'ID merek produk' })
  @IsOptional()
  @IsUUID('4')
  brandId?: string;

  @ApiPropertyOptional({ description: 'ID satuan produk (UOM)' })
  @IsOptional()
  @IsUUID('4')
  unitId?: string;

  @ApiPropertyOptional({ description: 'ID pajak terkait' })
  @IsOptional()
  @IsUUID('4')
  taxId?: string;

  @ApiPropertyOptional({ example: 12000, default: 0, description: 'Harga pokok modal' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  costPrice?: number = 0;

  @ApiPropertyOptional({ example: 20000, default: 0, description: 'Harga jual standar' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sellingPrice?: number = 0;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minStock?: number = 0;

  @ApiPropertyOptional({ example: 100, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxStock?: number = 0;

  @ApiPropertyOptional({ example: 'Y', description: 'Lacak persediaan stok (Y/N)' })
  @IsOptional()
  @IsString()
  isInventoryTracked?: string = 'Y';

  @ApiPropertyOptional({ example: 'Y', description: 'Tersedia untuk dijual (Y/N)' })
  @IsOptional()
  @IsString()
  isForSale?: string = 'Y';

  @ApiPropertyOptional({ example: 'https://example.com/kopi.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Kopi susu dengan racikan gula aren asli' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string = 'Y';

  @ApiPropertyOptional({ type: () => [CreateProductVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];

  @ApiPropertyOptional({ type: () => [CreateProductOutletPriceDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductOutletPriceDto)
  outletPrices?: CreateProductOutletPriceDto[];

  @ApiPropertyOptional({ type: () => [CreateModifierGroupDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierGroupDto)
  modifierGroups?: CreateModifierGroupDto[];
}
