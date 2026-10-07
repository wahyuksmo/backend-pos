import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class InitiateApprovalDto {
  @ApiProperty({ example: 'SALES_DISCOUNT', description: 'Target object code (e.g. SALES_DISCOUNT, VOID_TRANSACTION)' })
  @IsString()
  @IsNotEmpty()
  objectCode: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'Target record ID' })
  @IsUUID()
  @IsNotEmpty()
  objectId: string;

  @ApiPropertyOptional({ example: 450000, description: 'Transaction amount to match template condition' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'User who submitted the request' })
  @IsOptional()
  @IsUUID()
  requestedByUserId?: string;
}

