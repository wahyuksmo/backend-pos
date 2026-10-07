import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'SUP-001', description: 'Kode unik supplier' })
  @IsNotEmpty({ message: 'Kode supplier wajib diisi' })
  @IsString()
  supplierCode: string;

  @ApiProperty({ example: 'PT Sumber Kopi Makmur', description: 'Nama supplier / vendor' })
  @IsNotEmpty({ message: 'Nama supplier wajib diisi' })
  @IsString()
  supplierName: string;

  @ApiPropertyOptional({ example: 'Hendra Gunawan' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: '08119876543' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'sales@sumberkopi.co.id' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Kawasan Pergudangan Pluit Blok C No. 5' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '01.555.777.9-001.000' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional({ example: 'BCA' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @ApiPropertyOptional({ example: 'PT Sumber Kopi Makmur' })
  @IsOptional()
  @IsString()
  bankAccountHolder?: string;

  @ApiPropertyOptional({ example: 30, default: 0, description: 'Termin pembayaran dalam hari (TOP)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paymentTermDays?: number = 0;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
