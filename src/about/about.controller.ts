import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AboutService } from './about.service';
import { CurrentUserId } from '../common/decorators/current-user.decorator';
import { UpdateAboutDto } from './dto/update-about.dto';

@Controller('about')
export class AboutController {
  constructor(private readonly aboutService: AboutService) {}

  @Get()
  get() {
    return this.aboutService.find();
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'))
  update(@CurrentUserId() userId: string, @Body() dto: UpdateAboutDto) {
    return this.aboutService.update(userId, dto);
  }
}
