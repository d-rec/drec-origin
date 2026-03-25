import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatsTable1757000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.chats (
        uuid UUID NOT NULL DEFAULT gen_random_uuid(),
        username VARCHAR NOT NULL,
        "chatEntry" TEXT NOT NULL,
        "nextEntryUuid" UUID DEFAULT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT chats_pkey PRIMARY KEY (uuid),
        CONSTRAINT chats_next_fk FOREIGN KEY ("nextEntryUuid")
          REFERENCES public.chats(uuid) ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS public.chat_conversations (
        id SERIAL NOT NULL,
        participant1 VARCHAR NOT NULL,
        participant2 VARCHAR NOT NULL,
        "headUuid" UUID NOT NULL,
        CONSTRAINT chat_conversations_pkey PRIMARY KEY (id),
        CONSTRAINT chat_conversations_head_fk FOREIGN KEY ("headUuid")
          REFERENCES public.chats(uuid) ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS public.chat_conversations`);
    await queryRunner.query(`DROP TABLE IF EXISTS public.chats`);
  }
}
