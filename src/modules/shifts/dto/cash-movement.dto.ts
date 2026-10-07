import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CashMovementDto {
  @ApiProperty({ example: 'CASH_OUT', enum: ['CASH_IN', 'CASH_OUT'], description: 'Jenis pergerakan kas kecil' })
  @IsNotEmpty({ message: 'Jenis pergerakan kas wajib diisi' })
  @IsIn(['CASH_IN', 'CASH_OUT'], { message: 'Tipe harus CASH_IN atau CASH_OUT' })
  movementType: 'CASH_IN' | 'CASH_OUT';

  @ApiProperty({ example: 50000, description: 'Nominal uang masuk / keluar' })
  @IsNotEmpty({ message: 'Nominal wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Nominal harus angka' })
  @Min(1, { message: 'Nominal minimal Rp 1' })
  amount: number;

  @ApiProperty({ example: 'Beli galon air & es batu cadangan', description: 'Alasan pergerakan kas' })
  @IsNotEmpty({ message: 'Alasan wajib diisi' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ example: 'Toko Sebelah / Kurir', description: 'Penerima uang (jika kas keluar)' })
  @IsOptional()
  @IsString()
  recipient?: string;

  @ApiPropertyOptional({ example: 'Manager On Duty', description: 'Pihak yang mengizinkan' })
  @IsOptional()
  @IsString()
  authorizedBy?: string;
}
