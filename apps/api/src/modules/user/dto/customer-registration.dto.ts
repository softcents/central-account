import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CustomerType, CompanyPosition, Gender } from '@prisma/client';

export class SubmitCustomerRegistrationDto {
  // I. Customer Type
  @IsEnum(CustomerType, {
    message: 'Customer type must be either INDIVIDUAL or COMPANY',
  })
  @IsNotEmpty({ message: 'Customer type is required' })
  customerType: CustomerType;

  // II. Company Information (Required when customerType === 'COMPANY')
  @ValidateIf((o) => o.customerType === CustomerType.COMPANY)
  @IsString()
  @IsNotEmpty({ message: 'Company Name is required for company customers' })
  companyName?: string;

  @ValidateIf((o) => o.customerType === CustomerType.COMPANY)
  @IsString()
  @IsNotEmpty({ message: 'Authorized Person Name is required for company customers' })
  authorizedPersonName?: string;

  @ValidateIf((o) => o.customerType === CustomerType.COMPANY)
  @IsEnum(CompanyPosition, {
    message: 'Valid company position must be selected',
  })
  @IsNotEmpty({ message: 'Company Position is required for company customers' })
  companyPosition?: CompanyPosition;

  // III. Personal Information
  @IsString()
  @IsNotEmpty({ message: 'Full Name is required and must match your NID/Passport' })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'National ID / Passport Number is required' })
  nidPassportNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone Number is required' })
  phoneNumber: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email Address is required' })
  email: string;

  @IsDateString({}, { message: 'A valid birth date (YYYY-MM-DD) is required' })
  @IsNotEmpty({ message: 'Birth Date is required' })
  dateOfBirth: string;

  @IsEnum(Gender, {
    message: 'Gender must be MALE or FEMALE',
  })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;

  // IV. Present Address
  @IsString()
  @IsNotEmpty({ message: 'Present Street / Address is required' })
  presentStreet: string;

  @IsString()
  @IsNotEmpty({ message: 'Present City is required' })
  presentCity: string;

  @IsString()
  @IsNotEmpty({ message: 'Present Postal / ZIP Code is required' })
  presentPostalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Present Country is required' })
  presentCountry: string;

  // V. Permanent Address
  @IsBoolean()
  @IsOptional()
  sameAsPresentAddress?: boolean;

  @IsString()
  @IsNotEmpty({ message: 'Permanent Street / Address is required' })
  permanentStreet: string;

  @IsString()
  @IsNotEmpty({ message: 'Permanent City is required' })
  permanentCity: string;

  @IsString()
  @IsNotEmpty({ message: 'Permanent Postal / ZIP Code is required' })
  permanentPostalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'Permanent Country is required' })
  permanentCountry: string;

  // VI. Family Information
  @IsString()
  @IsNotEmpty({ message: "Father's Name is required" })
  fatherName: string;

  @IsString()
  @IsNotEmpty({ message: "Mother's Name is required" })
  motherName: string;

  // VII. Contact Information
  @IsString()
  @IsNotEmpty({ message: 'Contact Phone Number is required' })
  contactPhone: string;

  @IsEmail({}, { message: 'A valid Contact Email is required' })
  @IsNotEmpty({ message: 'Contact Email Address is required' })
  contactEmail: string;

  // VIII. KYC Verification & Declaration
  @IsBoolean()
  @IsNotEmpty({ message: 'KYC confirmation declaration is mandatory' })
  declarationConfirmed: boolean;
}
