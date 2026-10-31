import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Transform } from 'class-transformer';

// ─────────────────────────────────────────────────────────────────────────────
// Custom decorator: length must be 10, 13, or 17 (after strip transform)
// ─────────────────────────────────────────────────────────────────────────────
export function IsNidLength(opts?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNidLength',
      target: (object as any).constructor,
      propertyName,
      options: opts,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' && [10, 13, 17].includes(value.length)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be exactly 10, 13, or 17 digits after stripping spaces and hyphens`;
        },
      },
    });
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom decorator: YYYY-MM-DD, real calendar date, strictly in the past
// ─────────────────────────────────────────────────────────────────────────────
export function IsPastDate(opts?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isPastDate',
      target: (object as any).constructor,
      propertyName,
      options: opts,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

          const [y, m, d] = value.split('-').map(Number);
          // Confirm the date actually exists (rejects Feb 30, etc.)
          const date = new Date(Date.UTC(y, m - 1, d));
          if (
            date.getUTCFullYear() !== y ||
            date.getUTCMonth() + 1 !== m ||
            date.getUTCDate() !== d
          ) {
            return false;
          }

          // Must be strictly before today (UTC midnight)
          const todayUtc = new Date();
          todayUtc.setUTCHours(0, 0, 0, 0);
          return date.getTime() < todayUtc.getTime();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a real past date in YYYY-MM-DD format`;
        },
      },
    });
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DTO
// ─────────────────────────────────────────────────────────────────────────────
import { IsString, Matches } from 'class-validator';

export class NidCheckDto {
  /**
   * National ID / passport number.
   * Spaces and hyphens are stripped before validation.
   * Must consist of digits only, length 10 | 13 | 17.
   */
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/[\s-]/g, '') : value,
  )
  @IsString()
  @Matches(/^\d+$/, { message: 'nid must contain digits only' })
  @IsNidLength()
  nid: string;

  /**
   * Date of birth in YYYY-MM-DD (ISO 8601 date).
   * Must be a real calendar date strictly before today.
   */
  @IsString()
  @IsPastDate()
  dob: string;
}
