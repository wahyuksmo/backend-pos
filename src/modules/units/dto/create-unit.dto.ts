import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 'PCS', description: 'Kode satuan' })
  @IsNotEmpty({ message: 'Kode satuan wajib diisi' })
  @IsString()
  unitCode: string;

  @ApiProperty({ example: 'Pieces', description: 'Nama satuan' })
  @IsNotEmpty({ message: 'Nama satuan wajib diisi' })
  @IsString()
  unitName: string;

  @ApiPropertyOptional({ example: 'Satuan per biji / eceran' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
