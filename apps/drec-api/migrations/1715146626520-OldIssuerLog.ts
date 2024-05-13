import { MigrationInterface, QueryRunner } from 'typeorm';

export class OldIssuerLog1715146626520 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE old_issuer_certificate (            
            "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
            "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
            "id" SERIAL NOT NULL, 
            "deviceId" character varying NOT NULL,
            "generationStartTime" integer NOT NULL,
            "generationEndTime" integer NOT NULL,
            "creationTime" integer NOT NULL,
            "creationBlockHash" character varying,
            "owners" text NOT NULL,
            "claimers" text,
            "claims" text,
            "latestCommitment" text,
            "issuedPrivately" boolean NOT NULL,
            "blockchainNetId" integer,
            "metadata" character varying NOT NULL,
        )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
