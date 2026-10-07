import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTaxDto {
  @ApiProperty({ example: 'PPN11', description: 'Kode pajak / biaya' })
  @IsNotEmpty({ message: 'Kode pajak wajib diisi' })
  @IsString()
  taxCode: string;

  @ApiProperty({ example: 'Pajak Pertambahan Nilai 11%', description: 'Nama pajak' })
  @IsNotEmpty({ message: 'Nama pajak wajib diisi' })
  @IsString()
  taxName: string;

  @ApiProperty({ example: 11.0, description: 'Tarif pajak dalam persen' })
  @IsNotEmpty({ message: 'Tarif pajak wajib diisi' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Tarif harus berupa angka' })
  @Min(0, { message: 'Tarif minimal 0' })
  rate: number;

  @ApiPropertyOptional({ example: 'N', description: 'Apakah harga sudah termasuk pajak (Y/N)' })
  @IsOptional()
  @IsString()
  isInclusive?: string = 'N';

  @ApiPropertyOptional({ example: 'PPN standar sesuai peraturan perundangan' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
