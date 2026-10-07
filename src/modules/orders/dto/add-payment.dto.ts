import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderPaymentDto } from './create-order.dto';

export class AddPaymentDto {
  @ApiPropertyOptional({ type: [CreateOrderPaymentDto], description: 'Daftar transaksi pembayaran split' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderPaymentDto)
  payments?: CreateOrderPaymentDto[];

  @ApiPropertyOptional({ example: 'CASH', description: 'Metode pembayaran (CASH, QRIS, dsb)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'PM-CASH', description: 'Kode metode pembayaran' })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;

  @ApiPropertyOptional({ example: 'pay-method-uuid', description: 'ID metode pembayaran' })
  @IsOptional()
  @IsUUID('all')
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 50000, description: 'Nominal pembayaran' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ example: 100000, description: 'Nominal uang tunai diterima dari pelanggan' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  tenderedAmount?: number;

  @ApiPropertyOptional({ example: 'Pembayaran Kasir Mobile', description: 'Catatan pembayaran' })
  @IsOptional()
  @IsString()
  notes?: string;
}
