import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';

export class SinglePermissionDto {
  @ApiProperty({ description: 'Target menu ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  menuId: string;

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'N' })
  @IsEnum(['Y', 'N'])
  createPerm: string = 'N';

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'N' })
  @IsEnum(['Y', 'N'])
  readPerm: string = 'N';

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'N' })
  @IsEnum(['Y', 'N'])
  updatePerm: string = 'N';

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'N' })
  @IsEnum(['Y', 'N'])
  deletePerm: string = 'N';

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'N' })
  @IsEnum(['Y', 'N'])
  exportPerm: string = 'N';

  @ApiPropertyOptional({ enum: ['Y', 'N'], default: 'N' })
  @IsEnum(['Y', 'N'])
  importPerm: string = 'N';
}

export class BatchUpdatePermissionsDto {
  @ApiProperty({ description: 'Target usergroup / role ID (UUID)' })
  @IsUUID()
  @IsNotEmpty()
  usergroupId: string;

  @ApiProperty({ type: [SinglePermissionDto], description: 'List of menu permission matrix entries' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SinglePermissionDto)
  permissions: SinglePermissionDto[];
}
