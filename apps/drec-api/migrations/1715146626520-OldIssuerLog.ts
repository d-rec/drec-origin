import { MigrationInterface, QueryRunner } from 'typeorm';

export class OldIssuerLog1715146626520 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //IMPORTANT NOTE:  We have generated this entity to have a backup of our old certificate logs
    //generated before upgraded the @energyweb/issuer-api... because the old certificate logs are
    //not compatible with newly upgraded issuer-certificates struture..
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
