import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { IepPlan } from './iep-plan.entity';

@Entity('iep_goals')
export class IepGoal {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => IepPlan, (plan) => plan.goals, { onDelete: 'CASCADE' })
  plan: IepPlan;

  @Column()
  planId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  targetPercentage: number;

  @Column({ type: 'int', default: 0 })
  currentPercentage: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  teacherNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
