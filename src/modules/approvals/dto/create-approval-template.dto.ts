import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class ApprovalTemplateDetailItemDto {
  @ApiProperty({ example: 1, description: 'Step order sequence' })
  @IsInt()
  @Min(1)
  stepOrder: number;

  @ApiProperty({ example: 'Atasan Langsung', description: 'Step name' })
  @IsString()
  @IsNotEmpty()
  stepName: string;

  @ApiProperty({
    example: 'DIRECT_MANAGER',
    enum: ['DIRECT_MANAGER', 'ROLE', 'SPECIFIC_USER'],
    description: 'Approver type',
  })
  @IsIn(['DIRECT_MANAGER', 'ROLE', 'SPECIFIC_USER'])
  approverType: 'DIRECT_MANAGER' | 'ROLE' | 'SPECIFIC_USER';

  @ApiPropertyOptional({ example: null, description: 'UserGroup ID if approverType is ROLE' })
  @IsOptional()
  @IsUUID()
  usergroupId?: string;

  @ApiPropertyOptional({ example: null, description: 'User ID if approverType is SPECIFIC_USER' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'Y', description: 'Allow returning for revision (Y/N)' })
  @IsOptional()
  @IsIn(['Y', 'N'])
  canRevise?: string;
}

export class CreateApprovalTemplateDto {
  @ApiProperty({ example: 'APPR-DISCOUNT-SPV', description: 'Unique template code' })
  @IsString()
  @IsNotEmpty()
  templateCode: string;

  @ApiProperty({ example: 'Persetujuan Diskon Kasir Khusus', description: 'Template name' })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    example: 'SALES_DISCOUNT',
    description: 'Target object code (e.g. SALES_DISCOUNT, VOID_TRANSACTION, PURCHASE_ORDER)',
  })
  @IsString()
  @IsNotEmpty()
  objectCode: string;

  @ApiPropertyOptional({ example: 0, description: 'Minimum nominal amount (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({ example: 5000000, description: 'Maximum nominal amount (optional)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({ example: 'Approval diskon kasir di atas batas kewenangan kasir', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [ApprovalTemplateDetailItemDto], description: 'Template workflow steps' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalTemplateDetailItemDto)
  details: ApprovalTemplateDetailItemDto[];
}

