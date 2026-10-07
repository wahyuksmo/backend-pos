import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenShiftDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', description: 'ID Outlet' })
  @IsNotEmpty({ message: 'Outlet ID wajib diisi' })
  @IsUUID('all', { message: 'Format Outlet ID harus UUID' })
  outletId: string;

  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', description: 'ID Mesin Register / Kasir' })
  @IsNotEmpty({ message: 'Register ID wajib diisi' })
  @IsUUID('all', { message: 'Format Register ID harus UUID' })
  registerId: string;

  @ApiProperty({ example: 250000, description: 'Modal awal uang tunai di laci kasir' })
  @IsNotEmpty({ message: 'Modal awal wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Modal awal harus berupa angka' })
  @Min(0, { message: 'Modal awal tidak boleh negatif' })
  openingCash: number;
}
