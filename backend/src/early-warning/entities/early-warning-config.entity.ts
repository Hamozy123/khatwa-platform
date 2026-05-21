import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('early_warning_configs')
export class EarlyWarningConfig {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  indicator: string;

  @Column({ type: 'float', default: 0 })
  weight: number;

  @Column({ type: 'float', default: 50 })
  threshold: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  active: boolean;
}
