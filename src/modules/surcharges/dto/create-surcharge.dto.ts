import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateSurchargeDto {
  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID Outlet (opsional, kosong = berlaku global)' })
  @IsOptional()
  @IsUUID('4', { message: 'Outlet ID harus berupa UUID valid' })
  outletId?: string;

  @ApiProperty({ example: 'SC-5', description: 'Kode unik biaya / surcharge' })
  @IsString()
  @IsNotEmpty({ message: 'Kode surcharge wajib diisi' })
  @MaxLength(50)
  surchargeCode: string;

  @ApiProperty({ example: 'Service Charge Resto 5%', description: 'Nama biaya' })
  @IsString()
  @IsNotEmpty({ message: 'Nama surcharge wajib diisi' })
  @MaxLength(100)
  surchargeName: string;

  @ApiPropertyOptional({ example: 'PERCENTAGE', default: 'PERCENTAGE', description: 'PERCENTAGE atau FIXED_AMOUNT' })
  @IsOptional()
  @IsString()
  surchargeType?: string;

  @ApiProperty({ example: 5, description: 'Nilai persentase atau nominal' })
  @IsNumber()
  @Min(0, { message: 'Nilai surcharge tidak boleh negatif' })
  rateValue: number;

  @ApiPropertyOptional({ example: 'Y', default: 'Y', description: 'Kena PB1 / Pajak (Y/N)' })
  @IsOptional()
  @IsString()
  isTaxable?: string;

  @ApiPropertyOptional({ example: 'DINE_IN', default: 'ALL', description: 'ALL, DINE_IN, TAKEAWAY, DELIVERY' })
  @IsOptional()
  @IsString()
  applicableOrderType?: string;

  @ApiPropertyOptional({ example: 'Y', default: 'Y', description: 'Status aktif' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
