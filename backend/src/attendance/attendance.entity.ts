import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('attendance')
export class Attendance {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  studentId: number;

  @Column({ type: 'date' })
  date: string;

  @Column()
  status: string;

  @Column({ nullable: true, type: 'varchar' })
  checkIn: string;

  @Column({ nullable: true, type: 'varchar' })
  notes: string;

  @Column({ default: 0 })
  recordedBy: number;

  @CreateDateColumn()
  createdAt: Date;
}
