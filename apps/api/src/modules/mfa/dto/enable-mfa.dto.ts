import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EnableMfaDto {
  @IsString()
  @IsNotEmpty({ message: 'TOTP secret is required' })
  secret: string;

  @IsString()
  @Length(6, 6, { message: 'TOTP code must be exactly 6 digits' })
  code: string;
}
