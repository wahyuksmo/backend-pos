import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'superadmin', description: 'Username or email for authentication' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'SuperAdmin@123', description: 'User password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
