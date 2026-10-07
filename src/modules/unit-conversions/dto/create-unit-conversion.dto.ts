import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateUnitConversionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID Satuan Asal (misal: Karung)' })
  @IsUUID('4', { message: 'fromUnitId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Satuan asal wajib diisi' })
  fromUnitId: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f23456789012', description: 'ID Satuan Tujuan (misal: Kg)' })
  @IsUUID('4', { message: 'toUnitId harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Satuan tujuan wajib diisi' })
  toUnitId: string;

  @ApiProperty({ example: 50, description: 'Pengali konversi (1 Satuan Asal = X Satuan Tujuan)' })
  @IsNumber()
  @Min(0.0001, { message: 'Nilai pengali harus lebih besar dari 0' })
  multiplier: number;

  @ApiPropertyOptional({ example: 'Y', default: 'Y', description: 'Status aktif (Y/N)' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
