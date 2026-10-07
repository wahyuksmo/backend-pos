import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'CUST-0001', description: 'Kode unik pelanggan' })
  @IsNotEmpty({ message: 'Kode pelanggan wajib diisi' })
  @IsString()
  customerCode: string;

  @ApiProperty({ example: 'Budi Santoso', description: 'Nama pelanggan' })
  @IsNotEmpty({ message: 'Nama pelanggan wajib diisi' })
  @IsString()
  customerName: string;

  @ApiPropertyOptional({ description: 'ID grup pelanggan' })
  @IsOptional()
  @IsUUID('4', { message: 'ID customer group harus berformat UUID' })
  customerGroupId?: string;

  @ApiPropertyOptional({ example: '081234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'budi@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid' })
  email?: string;

  @ApiPropertyOptional({ example: 'Jl. Merdeka No. 45, Jakarta' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 0, default: 0, description: 'Poin loyalitas awal' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  loyaltyPoints?: number = 0;

  @ApiPropertyOptional({ example: 5000000, default: 0, description: 'Batas limit kredit / piutang' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number = 0;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
