import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class GenerateQrisDto {
  @ApiPropertyOptional({ description: 'ID Pesanan jika order sudah dibuat' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiProperty({ example: 'ORD-20261003-0001' })
  @IsNotEmpty()
  @IsString()
  orderNumber: string;

  @ApiProperty({ example: 45000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiPropertyOptional({ example: 'Budi Santoso' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: 'Cabang Utama' })
  @IsOptional()
  @IsString()
  outletName?: string;
}
