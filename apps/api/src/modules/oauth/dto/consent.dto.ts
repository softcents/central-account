import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConsentDto {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  redirectUri: string;

  @IsArray()
  @IsNotEmpty()
  scopes: string[];

  @IsString()
  @IsNotEmpty()
  codeChallenge: string;

  @IsString()
  @IsNotEmpty()
  codeChallengeMethod: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsBoolean()
  granted: boolean;
}
