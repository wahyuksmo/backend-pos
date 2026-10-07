import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateMenuDto {
  @ApiPropertyOptional({ description: 'Parent menu ID (UUID) if this is a sub-menu' })
  @IsUUID()
  @IsOptional()
  pid?: string;

  @ApiProperty({ example: 'PRODUCTS', description: 'Internal programmatic menu code' })
  @IsString()
  @IsNotEmpty()
  menuName: string;

  @ApiProperty({ example: 'Katalog Produk', description: 'Display title for UI navigation' })
  @IsString()
  @IsNotEmpty()
  menuTitle: string;

  @ApiPropertyOptional({ example: 'Package', description: 'Icon name / class' })
  @IsString()
  @IsOptional()
  menuIcon?: string;

  @ApiPropertyOptional({ example: '/products', description: 'Frontend route URL' })
  @IsString()
  @IsOptional()
  menuUrl?: string;

  @ApiPropertyOptional({ example: 1, default: 0, description: 'Display sequence order' })
  @IsInt()
  @Min(0)
  @IsOptional()
  menuPosition?: number = 0;
}
