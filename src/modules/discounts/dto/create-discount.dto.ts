import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDiscountDto {
  @ApiProperty({ example: 'PROMO-MERDEKA', description: 'Kode diskon / promosi' })
  @IsNotEmpty({ message: 'Kode diskon wajib diisi' })
  @IsString()
  discountCode: string;

  @ApiProperty({ example: 'Promo Merdeka 17%', description: 'Nama diskon / promosi' })
  @IsNotEmpty({ message: 'Nama diskon wajib diisi' })
  @IsString()
  discountName: string;

  @ApiPropertyOptional({ example: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED_AMOUNT'] })
  @IsOptional()
  @IsString()
  discountType?: string = 'PERCENTAGE';

  @ApiProperty({ example: 17.0, description: 'Nilai diskon (persen atau nominal rupiah)' })
  @IsNotEmpty({ message: 'Nilai diskon wajib diisi' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ example: 50000, default: 0, description: 'Minimal total belanja' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPurchase?: number = 0;

  @ApiPropertyOptional({ example: 25000, description: 'Maksimal potongan nominal rupiah' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiPropertyOptional({ example: '2026-08-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'N', description: 'Memerlukan approval SPV/Manager (Y/N)' })
  @IsOptional()
  @IsString()
  requiresApproval?: string = 'N';

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
