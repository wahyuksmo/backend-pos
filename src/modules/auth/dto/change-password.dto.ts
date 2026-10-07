import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword@123', description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewStrongPassword@2026', description: 'New password meeting password policies' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
