import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chat_conversations' })
export class ChatConversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  participant1: string;

  @Column({ type: 'varchar' })
  participant2: string;

  @Column({ type: 'uuid' })
  headUuid: string;

  @Column({ type: 'uuid', nullable: true, default: null })
  lastEntryUuid: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  deviceProjectName: string | null;
}
