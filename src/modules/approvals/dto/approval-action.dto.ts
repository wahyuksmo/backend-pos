import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApprovalActionDto {
  @ApiPropertyOptional({ example: 'Disetujui sesuai bukti kuitansi', description: 'Approval / rejection / revision notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

