import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rti_assessments')
export class RtiAssessment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column()
  previousTier: number;

  @Column()
  newTier: number;

  @Column({ nullable: true })
  reason: string;

  @Column({ default: 0 })
  assessedBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
