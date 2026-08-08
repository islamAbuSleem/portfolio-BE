import { SkillCategory } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(SkillCategory)
  category: SkillCategory;

  @IsInt()
  @Min(0)
  @Max(100)
  proficiency: number;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  icon?: string;
}
