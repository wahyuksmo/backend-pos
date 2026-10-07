import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'QRIS', description: 'Kode metode pembayaran' })
  @IsNotEmpty({ message: 'Kode metode bayar wajib diisi' })
  @IsString()
  methodCode: string;

  @ApiProperty({ example: 'QRIS Dinamis', description: 'Nama metode pembayaran' })
  @IsNotEmpty({ message: 'Nama metode bayar wajib diisi' })
  @IsString()
  methodName: string;

  @ApiPropertyOptional({
    example: 'QRIS',
    enum: ['CASH', 'EDC_DEBIT', 'EDC_CREDIT', 'QRIS', 'EWALLET', 'BANK_TRANSFER'],
  })
  @IsOptional()
  @IsString()
  methodType?: string = 'CASH';

  @ApiPropertyOptional({ example: 'PERCENTAGE', enum: ['NONE', 'PERCENTAGE', 'FIXED'] })
  @IsOptional()
  @IsString()
  feeType?: string = 'NONE';

  @ApiPropertyOptional({ example: 0.7, default: 0, description: 'Nilai MDR / Biaya transaksi' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  feeValue?: number = 0;

  @ApiPropertyOptional({ example: 'Y', description: 'Memerlukan nomor referensi/approval code (Y/N)' })
  @IsOptional()
  @IsString()
  requiresReference?: string = 'N';

  @ApiPropertyOptional({ example: 1, default: 0, description: 'Urutan tampilan kasir' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  displayOrder?: number = 0;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
