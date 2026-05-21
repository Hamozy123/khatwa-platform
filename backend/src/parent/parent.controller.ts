import { Body, Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ParentService } from './parent.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { ParentLoginDto } from './dto/parent-login.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';
import { Public } from '../core/public.decorator';

@Controller('parents')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Public()
  @Post('login')
  login(@Body() dto: ParentLoginDto) {
    return this.parentService.login(dto);
  }

  @Post()
  @Roles(...ROLES.ADMIN_MANAGER_UP)
  @AuditLogging({ action: 'CREATE', resource: 'parent' })
  create(@Body() dto: CreateParentDto) {
    return this.parentService.create(dto);
  }

  @Get()
  @Roles(...ROLES.SCHOOL_ADMIN_UP)
  findAll() {
    return this.parentService.findAll();
  }

  @Get(':id')
  @Roles(...ROLES.ALL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.parentService.findOne(id);
  }

  @Get(':id/children')
  @Roles(...ROLES.ALL)
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.parentService.findChildren(id);
  }
}
