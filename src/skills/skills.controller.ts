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
import { SkillsService } from './skills.service';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { ReorderDto } from '../common/dto/reorder.dto';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  getAll() {
    return this.skillsService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@CurrentUserId() userId: string, @Body() dto: CreateSkillDto) {
    return this.skillsService.create(userId, dto);
  }

  @Patch('reorder')
  @UseGuards(AuthGuard('jwt'))
  reorder(@CurrentUserId() userId: string, @Body() dto: ReorderDto) {
    return this.skillsService.updateMany(userId, dto.items);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillsService.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  remove(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.skillsService.remove(userId, id);
  }
}
