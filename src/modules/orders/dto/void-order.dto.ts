import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VoidOrderDto {
  @ApiProperty({ example: 'Pelanggan membatalkan pesanan karena salah pilih menu', description: 'Alasan pembatalan/void' })
  @IsNotEmpty({ message: 'Alasan void wajib diisi' })
  @IsString()
  reason: string;
}
