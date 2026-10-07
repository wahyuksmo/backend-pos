import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SimulateQrisDto {
  @ApiProperty({ example: 'TXQ-1727931000-ABCDEF' })
  @IsNotEmpty()
  @IsString()
  transactionId: string;
}
