import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { IepService } from './iep.service';
import { CreateIepPlanDto } from './dto/create-iep-plan.dto';
import { CreateIepGoalDto } from './dto/create-iep-goal.dto';
import { UpdateIepGoalDto } from './dto/update-iep-goal.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { AuditLogging } from '../core/audit.decorator';

@Controller('iep')
export class IepController {
  constructor(private readonly iepService: IepService) {}

  @Get('plans/student/:studentId')
  @Roles(...ROLES.ALL)
  findPlansByStudent(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.iepService.findPlansByStudent(studentId);
  }

  @Get('plans')
  @Roles(...ROLES.ALL)
  findPlans() {
    return this.iepService.findPlans();
  }

  @Post('plans')
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'CREATE', resource: 'iep_plan' })
  createPlan(@Body() dto: CreateIepPlanDto) {
    return this.iepService.createPlan(dto);
  }

  @Get('plans/:id')
  @Roles(...ROLES.ALL)
  findPlan(@Param('id', ParseIntPipe) id: number) {
    return this.iepService.findPlan(id);
  }

  @Put('plans/:id')
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'UPDATE', resource: 'iep_plan', resourceIdParam: 'id' })
  updatePlan(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateIepPlanDto>,
    @Req() req: Request, @Query('reason') reason?: string) {
    return this.iepService.updatePlan(id, dto, (req as any).user?.id || 0, reason);
  }

  @Get('plans/:id/versions')
  @Roles(...ROLES.ALL)
  getVersions(@Param('id', ParseIntPipe) id: number) {
    return this.iepService.getVersions(id);
  }

  @Get('generate-plop/:studentId')
  @Roles(...ROLES.ALL)
  async generatePlop(@Param('studentId', ParseIntPipe) studentId: number,
    @Query('disabilityType') disabilityType: string, @Query('diagnosis') diagnosis: string) {
    const plop = await this.iepService.generatePlop(studentId, disabilityType, diagnosis);
    return { plop };
  }

  @Get('generate-goal/:planId')
  @Roles(...ROLES.ALL)
  async generateGoal(@Param('planId', ParseIntPipe) planId: number,
    @Query('area') area: string, @Query('name') name?: string,
    @Query('skill') skill?: string, @Query('baseline') baseline?: string, @Query('target') target?: string) {
    const goal = await this.iepService.generateSmartGoal(Number(planId), area || 'academic', {
      name, skill, baseline: baseline ? Number(baseline) : undefined,
      target: target ? Number(target) : undefined,
    });
    return { goal };
  }

  @Post('goals')
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'CREATE', resource: 'iep_goal' })
  createGoal(@Body() dto: CreateIepGoalDto) {
    return this.iepService.createGoal(dto);
  }

  @Put('goals/:id')
  @Roles(...ROLES.ALL)
  @AuditLogging({ action: 'UPDATE', resource: 'iep_goal', resourceIdParam: 'id' })
  updateGoal(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIepGoalDto) {
    return this.iepService.updateGoal(id, dto);
  }

  @Delete('goals/:id')
  @Roles(...ROLES.DELETE)
  @AuditLogging({ action: 'DELETE', resource: 'iep_goal', resourceIdParam: 'id' })
  removeGoal(@Param('id', ParseIntPipe) id: number) {
    return this.iepService.removeGoal(id);
  }
}
