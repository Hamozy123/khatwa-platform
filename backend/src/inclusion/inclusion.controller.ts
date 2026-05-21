import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Req } from '@nestjs/common';
import { InclusionService } from './inclusion.service';
import { CreateAccommodationDto } from './dto/create-accommodation.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { Request } from 'express';

@Controller('inclusion')
export class InclusionController {
  constructor(private readonly inclusionService: InclusionService) {}

  @Post('accommodations')
  @Roles(...ROLES.ALL)
  create(@Body() dto: CreateAccommodationDto, @Req() req: Request) {
    return this.inclusionService.create(dto, (req as any).user.userId);
  }

  @Get('accommodations/student/:studentId')
  @Roles(...ROLES.ALL)
  findByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.inclusionService.findByStudent(studentId);
  }

  @Put('accommodations/:id')
  @Roles(...ROLES.ALL)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateAccommodationDto>) {
    return this.inclusionService.update(id, dto);
  }

  @Delete('accommodations/:id')
  @Roles(...ROLES.DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inclusionService.remove(id);
  }
}
