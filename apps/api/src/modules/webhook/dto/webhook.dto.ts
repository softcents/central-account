import { IsArray, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsUrl({ require_tld: false }, { message: 'Must be a valid HTTP or HTTPS endpoint URL' })
  url: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];
}
