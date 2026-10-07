import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSalesChannelDto {
  @ApiProperty({ example: 'GOFOOD', description: 'Kode unik channel/order type' })
  @IsString()
  @IsNotEmpty({ message: 'Kode saluran penjualan wajib diisi' })
  @MaxLength(50)
  channelCode: string;

  @ApiProperty({ example: 'GoFood Online Delivery', description: 'Nama saluran penjualan' })
  @IsString()
  @IsNotEmpty({ message: 'Nama saluran penjualan wajib diisi' })
  @MaxLength(100)
  channelName: string;

  @ApiPropertyOptional({ example: 'DELIVERY', default: 'DINE_IN', description: 'DINE_IN, TAKEAWAY, DELIVERY' })
  @IsOptional()
  @IsString()
  orderType?: string;

  @ApiPropertyOptional({ example: 20, default: 0, description: 'Markup harga produk (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMarkupPercent?: number;

  @ApiPropertyOptional({ example: 20, default: 0, description: 'Potongan komisi platform (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platformCommissionPercent?: number;

  @ApiPropertyOptional({ example: 'Y', default: 'N', description: 'Otomatis terima order (Y/N)' })
  @IsOptional()
  @IsString()
  autoAcceptOrder?: string;

  @ApiPropertyOptional({ example: 'Y', default: 'Y', description: 'Status aktif (Y/N)' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
