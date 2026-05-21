import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('iep_plan_versions')
export class IepPlanVersion {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  planId: number;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, any>;

  @Column({ default: 0 })
  createdBy: number;

  @Column({ nullable: true })
  changeReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
