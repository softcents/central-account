import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TokenRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'grant_type is required' })
  grant_type: string; // 'authorization_code' | 'refresh_token'

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  redirect_uri?: string;

  @IsString()
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  client_secret?: string;

  @IsString()
  @IsOptional()
  code_verifier?: string;

  @IsString()
  @IsOptional()
  refresh_token?: string;
}
