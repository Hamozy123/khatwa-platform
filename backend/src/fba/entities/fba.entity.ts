import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fba_records')
export class FbaRecord {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column({ type: 'jsonb', default: [] })
  antecedents: { description: string; frequency: string; notes?: string }[];

  @Column({ type: 'jsonb', default: [] })
  behaviors: { description: string; duration?: string; intensity?: string }[];

  @Column({ type: 'jsonb', default: [] })
  consequences: { description: string; effectiveness?: string; notes?: string }[];

  @Column({ type: 'text', nullable: true })
  hypothesis: string;

  @Column({ type: 'text', nullable: true })
  targetBehavior: string;

  @Column({ type: 'jsonb', nullable: true })
  bip: {
    replacementBehavior: string;
    interventionStrategies: string[];
    reinforcementPlan: string;
    crisisPlan?: string;
    reviewDate?: string;
  };

  @Column({ nullable: true })
  date: string;

  @Column({ default: 0 })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
