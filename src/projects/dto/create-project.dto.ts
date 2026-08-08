import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  techs: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  liveUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  githubUrl?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;
}
