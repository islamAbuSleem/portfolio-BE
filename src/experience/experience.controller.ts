import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExperienceService } from './experience.service';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import { ReorderDto } from '../common/dto/reorder.dto';

@Controller('experience')
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  getAll() {
    return this.experienceService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUserId() userId: string, @Body() dto: CreateExperienceDto) {
    return this.experienceService.create(userId, dto);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard('jwt'))
  reorder(@CurrentUserId() userId: string, @Body() dto: ReorderDto) {
    return this.experienceService.updateMany(userId, dto.items);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ) {
    return this.experienceService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.experienceService.remove(userId, id);
  }
}
