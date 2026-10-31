import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  Equals,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Country is required' })
  countryCode: string;

  @IsBoolean({ message: 'Terms and Privacy acceptance must be a boolean' })
  @Equals(true, { message: 'You must accept the terms and privacy policy' })
  termsAccepted: boolean;
}
