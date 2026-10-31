import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestEmailChangeDto {
  @IsEmail({}, { message: 'A valid new email address is required' })
  @IsNotEmpty()
  newEmail: string;
}
