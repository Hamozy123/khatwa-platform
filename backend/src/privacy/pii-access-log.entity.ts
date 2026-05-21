import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pii_access_logs')
export class PiiAccessLog {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  userId: number;

  @Column()
  userRole: string;

  @Column()
  action: string;

  @Column()
  resource: string;

  @Column()
  resourceId: number;

  @Column({ nullable: true })
  studentId: number;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: false })
  granted: boolean;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn()
  createdAt: Date;
}
