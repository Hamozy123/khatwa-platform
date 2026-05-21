import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @Roles(...ROLES.ALL)
  findAll(@Query('type') type?: string, @Query('parentId') parentId?: string) {
    return this.locationsService.findAll(type, parentId ? Number(parentId) : undefined);
  }
}
