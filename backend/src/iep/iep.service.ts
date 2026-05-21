import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IepPlan } from './entities/iep-plan.entity';
import { IepGoal } from './entities/iep-goal.entity';
import { IepPlanVersion } from './entities/iep-plan-version.entity';
import { CreateIepPlanDto } from './dto/create-iep-plan.dto';
import { CreateIepGoalDto } from './dto/create-iep-goal.dto';
import { UpdateIepGoalDto } from './dto/update-iep-goal.dto';

const SMART_TEMPLATES: Record<string, { area: string; templates: string[] }> = {
  'academic': {
    area: 'academic',
    templates: [
      'By {endDate}, {name} will correctly answer {target}% of {skill} questions, from a baseline of {baseline}%, measured weekly.',
      '{name} will complete {skill} assignments with {target}% accuracy in {frequency} of trials by {endDate}.',
      'Given {support}, {name} will read {skill} at {target} words per minute by {endDate}.',
    ],
  },
  'behavior': {
    area: 'behavior',
    templates: [
      '{name} will reduce instances of {behavior} from {baseline} to {target} per day by {endDate}, tracked via daily logs.',
      'When {antecedent}, {name} will use {replacement} instead of {behavior} in {target}% of opportunities by {endDate}.',
    ],
  },
  'social': {
    area: 'social',
    templates: [
      '{name} will initiate peer interaction {target} times per week by {endDate}, from a baseline of {baseline}.',
      'During unstructured time, {name} will use appropriate social skills in {target}% of observed intervals by {endDate}.',
    ],
  },
  'communication': {
    area: 'communication',
    templates: [
      'Using {system}, {name} will request wants/needs with {target}% independence by {endDate}.',
      '{name} will use {words} words per utterance in {target}% of language samples by {endDate}.',
    ],
  },
  'motor': {
    area: 'motor',
    templates: [
      '{name} will complete {skill} with {target}% accuracy in {frequency} of trials by {endDate}.',
      'Given {support}, {name} will demonstrate {skill} for {duration} seconds by {endDate}.',
    ],
  },
};

@Injectable()
export class IepService {
  constructor(
    @InjectRepository(IepPlan)
    private readonly iepPlanRepository: Repository<IepPlan>,
    @InjectRepository(IepGoal)
    private readonly iepGoalRepository: Repository<IepGoal>,
    @InjectRepository(IepPlanVersion)
    private readonly versionRepository: Repository<IepPlanVersion>,
    private readonly dataSource: DataSource,
  ) {}

  async findPlans() {
    return this.iepPlanRepository.find({ relations: ['goals'] });
  }

  async findPlansByStudent(studentId: number) {
    return this.iepPlanRepository.find({
      where: { studentId },
      relations: ['goals'],
      order: { id: 'DESC' },
    });
  }

  async findPlan(id: number) {
    const plan = await this.iepPlanRepository.findOne({ where: { id }, relations: ['goals'] });
    if (!plan) throw new NotFoundException('IEP plan not found');
    return plan;
  }

  async createPlan(dto: CreateIepPlanDto) {
    const plan = this.iepPlanRepository.create({ ...dto, version: 1 });
    const saved = await this.iepPlanRepository.save(plan);

    await this.versionRepository.save({
      planId: saved.id,
      snapshot: saved,
      createdBy: dto.createdBy || 0,
      changeReason: 'Initial creation',
    });

    return saved;
  }

  async updatePlan(id: number, dto: Partial<CreateIepPlanDto>, userId = 0, changeReason?: string) {
    const plan = await this.findPlan(id);
    Object.assign(plan, dto, { version: (plan.version || 1) + 1 });
    const saved = await this.iepPlanRepository.save(plan);

    await this.versionRepository.save({
      planId: id,
      snapshot: saved,
      createdBy: userId,
      changeReason: changeReason || 'Plan updated',
    });

    return saved;
  }

  async getVersions(planId: number) {
    return this.versionRepository.find({
      where: { planId },
      order: { createdAt: 'DESC' },
    });
  }

  async generatePlop(studentId: number, disabilityType: string, diagnosis: string): Promise<string> {
    const disability = (disabilityType || '').toLowerCase();
    const diagnosis_lc = (diagnosis || '').toLowerCase();

    let strengths: string[] = [];
    let needs: string[] = [];

    if (disability.includes('autism') || diagnosis_lc.includes('autism') || diagnosis_lc.includes('توحد')) {
      strengths = ['Visual memory', 'Rote learning', 'Adherence to routines'];
      needs = ['Social communication', 'Flexibility in transitions', 'Sensory regulation'];
    } else if (disability.includes('intellectual') || diagnosis_lc.includes('اعاقة ذهنية')) {
      strengths = ['Cooperative attitude', 'Daily living skills with support'];
      needs = ['Academic concepts', 'Abstract reasoning', 'Independent task completion'];
    } else if (disability.includes('ld') || disability.includes('learning') || diagnosis_lc.includes('صعوبات')) {
      strengths = ['Verbal expression', 'Creative thinking'];
      needs = ['Reading fluency', 'Written expression', 'Phonological awareness'];
    } else if (disability.includes('adhd') || diagnosis_lc.includes('adhd') || diagnosis_lc.includes('فرط')) {
      strengths = ['Energetic participation', 'Creative problem solving'];
      needs = ['Sustained attention', 'Organization', 'Impulse control'];
    } else if (disability.includes('speech') || diagnosis_lc.includes('نطق') || diagnosis_lc.includes('كلام')) {
      strengths = ['Non-verbal communication', 'Social motivation'];
      needs = ['Articulation', 'Expressive language', 'Pragmatic language'];
    } else {
      strengths = ['Engagement in preferred activities', 'Positive response to one-on-one support'];
      needs = ['Individualized instruction', 'Skill generalization'];
    }

    const preferences = ['Visual schedules', 'Choice-making opportunities', 'Positive reinforcement'];

    const plop = `Present Levels of Academic Achievement and Functional Performance (PLOP)\n\n`
      + `Strengths:\n${strengths.map((s) => `- ${s}`).join('\n')}\n\n`
      + `Needs:\n${needs.map((n) => `- ${n}`).join('\n')}\n\n`
      + `Preferences:\n${preferences.map((p) => `- ${p}`).join('\n')}\n\n`
      + `Student demonstrates strength in ${strengths[0]?.toLowerCase() || 'learning'} `
      + `but requires support in ${needs[0]?.toLowerCase() || 'skill development'}. `
      + `Instruction should incorporate ${preferences[0]?.toLowerCase() || 'visual supports'} and positive behavior supports.`;

    return plop;
  }

  async generateSmartGoal(planId: number, area: string, context: {
    name?: string; skill?: string; behavior?: string; baseline?: number; target?: number;
    endDate?: string; support?: string; frequency?: string; replacement?: string;
    antecedent?: string; system?: string; words?: number; duration?: string;
  } = {}): Promise<string> {
    const templates = SMART_TEMPLATES[area];
    if (!templates) throw new NotFoundException(`No templates for area: ${area}`);

    const template = templates.templates[Math.floor(Math.random() * templates.templates.length)];

    return template
      .replace(/{name}/g, context.name || 'The student')
      .replace(/{skill}/g, context.skill || 'target skill')
      .replace(/{behavior}/g, context.behavior || 'target behavior')
      .replace(/{baseline}/g, String(context.baseline ?? 0))
      .replace(/{target}/g, String(context.target ?? 80))
      .replace(/{endDate}/g, context.endDate || 'the end of the IEP period')
      .replace(/{support}/g, context.support || 'direct instruction')
      .replace(/{frequency}/g, context.frequency || '3 out of 5')
      .replace(/{replacement}/g, context.replacement || 'replacement behavior')
      .replace(/{antecedent}/g, context.antecedent || 'presented with a non-preferred task')
      .replace(/{system}/g, context.system || 'an AAC device')
      .replace(/{words}/g, String(context.words ?? 3))
      .replace(/{duration}/g, context.duration || '5 minutes');
  }

  async createGoal(dto: CreateIepGoalDto) {
    const goal = this.iepGoalRepository.create(dto);
    return this.iepGoalRepository.save(goal);
  }

  async updateGoal(id: number, dto: UpdateIepGoalDto) {
    const goal = await this.iepGoalRepository.findOne({ where: { id } });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    const patch = Object.fromEntries(
      Object.entries(dto).filter(([, v]) => v !== undefined),
    ) as Partial<IepGoal>;
    Object.assign(goal, patch);
    return this.iepGoalRepository.save(goal);
  }

  async removeGoal(id: number) {
    const res = await this.iepGoalRepository.delete(id);
    if (!res.affected) {
      throw new NotFoundException('Goal not found');
    }
  }
}
