import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmEmailChangeDto {
  @IsString()
  @IsNotEmpty({ message: 'Confirmation token is required' })
  token: string;
}
