import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: 'teacher' })
  role: string;

  @Column({ nullable: true })
  schoolName: string;

  @Column({ nullable: true })
  administration: string;

  @Column({ nullable: true })
  directorate: string;

  @Column({ nullable: true })
  governorate: string;

  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true })
  lockedUntil: Date;
}
