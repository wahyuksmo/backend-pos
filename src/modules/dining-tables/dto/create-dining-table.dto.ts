import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateDiningTableDto {
  @ApiProperty({ description: 'ID outlet cabang' })
  @IsNotEmpty({ message: 'Outlet wajib dipilih' })
  @IsUUID('4', { message: 'ID outlet harus berformat UUID' })
  outletId: string;

  @ApiProperty({ example: 'T-01', description: 'Nomor / kode meja' })
  @IsNotEmpty({ message: 'Kode meja wajib diisi' })
  @IsString()
  tableCode: string;

  @ApiProperty({ example: 'Meja 01 Indoor', description: 'Nama meja' })
  @IsNotEmpty({ message: 'Nama meja wajib diisi' })
  @IsString()
  tableName: string;

  @ApiPropertyOptional({ example: 'Indoor Lantai 1', description: 'Area / bagian resto' })
  @IsOptional()
  @IsString()
  section?: string;

  @ApiPropertyOptional({ example: 4, default: 4, description: 'Kapasitas kursi' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number = 4;

  @ApiPropertyOptional({ example: 'AVAILABLE', enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'] })
  @IsOptional()
  @IsString()
  status?: string = 'AVAILABLE';

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
