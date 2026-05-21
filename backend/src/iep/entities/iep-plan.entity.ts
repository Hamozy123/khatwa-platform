import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IepGoal } from './iep-goal.entity';

@Entity('iep_plans')
export class IepPlan {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({ nullable: true })
  status: string;

  @Column({ nullable: true })
  createdBy: number;

  @Column({ type: 'text', nullable: true })
  plop: string;

  @Column({ type: 'jsonb', nullable: true })
  plopData: {
    strengths: string[];
    needs: string[];
    preferences: string[];
    baselineData?: Record<string, any>;
  };

  @Column({ nullable: true })
  version: number;

  @OneToMany(() => IepGoal, (goal) => goal.plan, { cascade: true })
  goals: IepGoal[];

  @CreateDateColumn()
  createdAt: Date;
}
