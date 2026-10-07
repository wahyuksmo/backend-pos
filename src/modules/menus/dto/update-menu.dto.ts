import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateMenuDto {
  @ApiPropertyOptional({ description: 'Parent menu ID (UUID)' })
  @IsUUID()
  @IsOptional()
  pid?: string;

  @ApiPropertyOptional({ example: 'PRODUCTS' })
  @IsString()
  @IsOptional()
  menuName?: string;

  @ApiPropertyOptional({ example: 'Katalog Produk' })
  @IsString()
  @IsOptional()
  menuTitle?: string;

  @ApiPropertyOptional({ example: 'Package' })
  @IsString()
  @IsOptional()
  menuIcon?: string;

  @ApiPropertyOptional({ example: '/products' })
  @IsString()
  @IsOptional()
  menuUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  menuPosition?: number;
}
