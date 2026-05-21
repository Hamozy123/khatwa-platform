import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('behavior_assessments')
export class BehaviorAssessment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column()
  date: string;

  @Column({ type: 'jsonb', default: {} })
  indicators: Record<string, number>;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 0 })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
