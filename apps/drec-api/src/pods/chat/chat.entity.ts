import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ type: 'varchar' })
  username: string;

  @Column({ type: 'text' })
  chatEntry: string;

  @Column({ type: 'uuid', nullable: true, default: null })
  nextEntryUuid: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
