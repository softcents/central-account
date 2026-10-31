import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  password: string;

  @IsString()
  @IsOptional()
  mfaCode?: string;

  @IsString()
  @IsOptional()
  mfaToken?: string;
}
