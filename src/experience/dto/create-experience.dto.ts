import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Prisma requires full ISO-8601 DateTimes, so date-only payloads from
 * <input type="date"> are normalized to UTC midnight before persist/validate.
 */
export const normalizeDate = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length === 0) return undefined;
  return value.length === 10 ? `${value}T00:00:00.000Z` : value;
};

export class CreateExperienceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  company: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  role: string;

  @Transform(({ value }) => normalizeDate(value))
  @IsDateString()
  startDate: string;

  @Transform(({ value }) => normalizeDate(value))
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;
}
