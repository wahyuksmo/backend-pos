import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CloseShiftDto {
  @ApiProperty({ example: 1450000, description: 'Uang fisik riil yang dihitung kasir saat tutup kasir' })
  @IsNotEmpty({ message: 'Uang fisik riil wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Uang fisik riil harus berupa angka' })
  @Min(0, { message: 'Uang fisik riil tidak boleh negatif' })
  actualCash: number;

  @ApiPropertyOptional({ example: 'Sisa uang kas kecil disimpan di brankas toko', description: 'Catatan penutupan kasir' })
  @IsOptional()
  @IsString()
  closingNotes?: string;
}
