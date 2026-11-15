import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'alice@demo.edu' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'DemoPass123!' })
  @IsString()
  @MaxLength(128)
  password: string;
}
