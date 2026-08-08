import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAboutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  bio: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  resumeUrl?: string;
}
