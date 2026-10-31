import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AuthorizeQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'client_id is required' })
  client_id: string;

  @IsString()
  @IsNotEmpty({ message: 'redirect_uri is required' })
  redirect_uri: string;

  @IsString()
  @IsNotEmpty({ message: 'response_type is required' })
  response_type: string; // must be 'code'

  @IsString()
  @IsNotEmpty({ message: 'scope is required' })
  scope: string; // e.g. 'openid profile email identity'

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsNotEmpty({ message: 'PKCE code_challenge is required' })
  code_challenge: string;

  @IsString()
  @IsNotEmpty({ message: 'code_challenge_method must be S256' })
  code_challenge_method: string; // must be 'S256'
}
