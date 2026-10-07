import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateKitchenStationDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'ID Outlet' })
  @IsUUID('4', { message: 'Outlet ID harus berupa UUID valid' })
  @IsNotEmpty({ message: 'Outlet ID wajib diisi' })
  outletId: string;

  @ApiProperty({ example: 'KS-BAR', description: 'Kode unik station per outlet' })
  @IsString()
  @IsNotEmpty({ message: 'Kode kitchen station wajib diisi' })
  @MaxLength(50)
  stationCode: string;

  @ApiProperty({ example: 'Bar Minuman & Kopi', description: 'Nama station' })
  @IsString()
  @IsNotEmpty({ message: 'Nama kitchen station wajib diisi' })
  @MaxLength(100)
  stationName: string;

  @ApiPropertyOptional({ example: 'NETWORK', default: 'NETWORK', description: 'NETWORK, BLUETOOTH, USB, NONE' })
  @IsOptional()
  @IsString()
  printerType?: string;

  @ApiPropertyOptional({ example: '192.168.1.200', description: 'IP Printer' })
  @IsOptional()
  @IsString()
  printerIp?: string;

  @ApiPropertyOptional({ example: 9100, default: 9100, description: 'Port Printer' })
  @IsOptional()
  @IsInt()
  printerPort?: number;

  @ApiPropertyOptional({ example: 'Y', default: 'N', description: 'Aktifkan KDS screen' })
  @IsOptional()
  @IsString()
  isKdsEnabled?: string;

  @ApiPropertyOptional({ example: 'Y', default: 'Y', description: 'Status aktif' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
