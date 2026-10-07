import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateRecipeDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID Menu Produk Jadi' })
  @IsUUID('4', { message: 'productId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Produk menu wajib dipilih' })
  productId: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', description: 'ID Varian Produk (opsional)' })
  @IsOptional()
  @IsUUID('4')
  variantId?: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-345678901234', description: 'ID Produk Bahan Baku' })
  @IsUUID('4', { message: 'ingredientProductId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Bahan baku wajib dipilih' })
  ingredientProductId: string;

  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-def0-456789012345', description: 'ID Satuan Takaran' })
  @IsUUID('4', { message: 'unitId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Satuan takaran wajib dipilih' })
  unitId: string;

  @ApiProperty({ example: 30, description: 'Jumlah takaran per porsi' })
  @IsNumber()
  @Min(0.0001, { message: 'Takaran resep harus lebih besar dari 0' })
  quantity: number;

  @ApiPropertyOptional({ example: 5, default: 0, description: 'Estimasi susut/waste (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wastagePercent?: number;

  @ApiPropertyOptional({ example: 4500, default: 0, description: 'Estimasi HPP bahan' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 'Y', default: 'Y', description: 'Status aktif (Y/N)' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
