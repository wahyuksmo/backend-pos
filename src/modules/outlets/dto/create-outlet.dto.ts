import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOutletDto {
  @ApiProperty({ example: 'OUT-001', description: 'Kode cabang / outlet' })
  @IsNotEmpty({ message: 'Kode outlet wajib diisi' })
  @IsString()
  outletCode: string;

  @ApiProperty({ example: 'Outlet Pusat Jakarta', description: 'Nama cabang / outlet' })
  @IsNotEmpty({ message: 'Nama outlet wajib diisi' })
  @IsString()
  outletName: string;

  @ApiPropertyOptional({ example: '021-1234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'jakarta@pos.local' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Jl. Sudirman No. 10' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Jakarta Pusat' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'DKI Jakarta' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: '10220' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: '01.234.567.8-012.000' })
  @IsOptional()
  @IsString()
  taxNumber?: string;

  @ApiPropertyOptional({ example: 'Selamat Datang di Toko Kami' })
  @IsOptional()
  @IsString()
  receiptHeader?: string;

  @ApiPropertyOptional({ example: 'Terima kasih atas kunjungan Anda' })
  @IsOptional()
  @IsString()
  receiptFooter?: string;

  @ApiPropertyOptional({ example: 'N', description: 'Outlet pusat (Y/N)' })
  @IsOptional()
  @IsString()
  isCentral?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
