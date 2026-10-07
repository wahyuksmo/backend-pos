import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRegisterDto {
  @ApiProperty({ example: 'a0000000-0000-0000-0000-000000000001', description: 'ID outlet cabang' })
  @IsNotEmpty({ message: 'Outlet wajib dipilih' })
  @IsUUID('4', { message: 'ID outlet harus berformat UUID' })
  outletId: string;

  @ApiProperty({ example: 'REG-01', description: 'Kode unik register kasir' })
  @IsNotEmpty({ message: 'Kode register wajib diisi' })
  @IsString()
  registerCode: string;

  @ApiProperty({ example: 'Kasir Utama Lantai 1', description: 'Nama register' })
  @IsNotEmpty({ message: 'Nama register wajib diisi' })
  @IsString()
  registerName: string;

  @ApiPropertyOptional({ example: '00:1B:44:11:3A:B7' })
  @IsOptional()
  @IsString()
  macAddress?: string;

  @ApiPropertyOptional({ example: '192.168.1.101' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mesin POS touchscreen dekat pintu masuk' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
