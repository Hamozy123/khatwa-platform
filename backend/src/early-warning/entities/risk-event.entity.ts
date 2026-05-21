import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('risk_events')
export class RiskEvent {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column()
  indicator: string;

  @Column({ type: 'float' })
  value: number;

  @Column({ type: 'float', nullable: true })
  weightedScore: number;

  @Column({ default: false })
  flagged: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  recordedBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
