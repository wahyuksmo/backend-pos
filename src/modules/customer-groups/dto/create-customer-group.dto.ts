import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerGroupDto {
  @ApiProperty({ example: 'GRP-VIP', description: 'Kode grup pelanggan' })
  @IsNotEmpty({ message: 'Kode grup wajib diisi' })
  @IsString()
  groupCode: string;

  @ApiProperty({ example: 'Pelanggan VIP Gold', description: 'Nama grup pelanggan' })
  @IsNotEmpty({ message: 'Nama grup wajib diisi' })
  @IsString()
  groupName: string;

  @ApiPropertyOptional({ example: 10.0, default: 0, description: 'Diskon otomatis dalam persen' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPercent?: number = 0;

  @ApiPropertyOptional({ example: 'Member prioritas dengan diskon 10%' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Y' })
  @IsOptional()
  @IsString()
  isActive?: string;
}
