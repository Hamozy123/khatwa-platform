import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewModules1716000000000 implements MigrationInterface {
  name = 'AddNewModules1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns to students table
    await queryRunner.query(`ALTER TABLE "students" ADD "rtiTier" integer NOT NULL DEFAULT 2`);
    await queryRunner.query(`ALTER TABLE "students" ADD "rtiTierAssessedAt" TIMESTAMP`);
    await queryRunner.query(`ALTER TABLE "students" ADD "riskScore" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "students" ADD "riskScoreUpdatedAt" TIMESTAMP`);

    // Add columns to iep_plans table
    await queryRunner.query(`ALTER TABLE "iep_plans" ADD "plop" text`);
    await queryRunner.query(`ALTER TABLE "iep_plans" ADD "plopData" jsonb`);
    await queryRunner.query(`ALTER TABLE "iep_plans" ADD "version" integer`);

    // rti_assessments
    await queryRunner.query(`
      CREATE TABLE "rti_assessments" (
        "id" SERIAL NOT NULL,
        "studentId" integer NOT NULL,
        "previousTier" integer NOT NULL,
        "newTier" integer NOT NULL,
        "reason" character varying,
        "assessedBy" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rti_assessments" PRIMARY KEY ("id")
      )
    `);

    // early_warning_configs
    await queryRunner.query(`
      CREATE TABLE "early_warning_configs" (
        "id" SERIAL NOT NULL,
        "indicator" character varying NOT NULL,
        "weight" double precision NOT NULL DEFAULT 0,
        "threshold" double precision NOT NULL DEFAULT 50,
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_early_warning_configs" PRIMARY KEY ("id")
      )
    `);

    // risk_events
    await queryRunner.query(`
      CREATE TABLE "risk_events" (
        "id" SERIAL NOT NULL,
        "studentId" integer NOT NULL,
        "indicator" character varying NOT NULL,
        "value" double precision NOT NULL,
        "weightedScore" double precision,
        "flagged" boolean NOT NULL DEFAULT false,
        "notes" text,
        "recordedBy" integer,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_risk_events" PRIMARY KEY ("id")
      )
    `);

    // fba_records
    await queryRunner.query(`
      CREATE TABLE "fba_records" (
        "id" SERIAL NOT NULL,
        "studentId" integer NOT NULL,
        "antecedents" jsonb NOT NULL DEFAULT '[]',
        "behaviors" jsonb NOT NULL DEFAULT '[]',
        "consequences" jsonb NOT NULL DEFAULT '[]',
        "hypothesis" text,
        "targetBehavior" character varying,
        "bip" jsonb,
        "date" character varying,
        "createdBy" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_fba_records" PRIMARY KEY ("id")
      )
    `);

    // abc_records
    await queryRunner.query(`
      CREATE TABLE "abc_records" (
        "id" SERIAL NOT NULL,
        "studentId" integer NOT NULL,
        "antecedent" text NOT NULL,
        "behavior" text NOT NULL,
        "consequence" text NOT NULL,
        "date" character varying,
        "time" character varying,
        "location" character varying,
        "notes" text,
        "recordedBy" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_abc_records" PRIMARY KEY ("id")
      )
    `);

    // parents
    await queryRunner.query(`
      CREATE TABLE "parents" (
        "id" SERIAL NOT NULL,
        "fullName" character varying NOT NULL,
        "phone" character varying NOT NULL,
        "email" character varying,
        "pinHash" character varying NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_parents_phone" UNIQUE ("phone"),
        CONSTRAINT "UQ_parents_email" UNIQUE ("email"),
        CONSTRAINT "PK_parents" PRIMARY KEY ("id")
      )
    `);

    // pii_access_logs
    await queryRunner.query(`
      CREATE TABLE "pii_access_logs" (
        "id" SERIAL NOT NULL,
        "userId" integer NOT NULL,
        "userRole" character varying NOT NULL,
        "action" character varying NOT NULL,
        "resource" character varying NOT NULL,
        "resourceId" integer NOT NULL,
        "studentId" integer,
        "ipAddress" character varying,
        "granted" boolean NOT NULL DEFAULT false,
        "reason" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pii_access_logs" PRIMARY KEY ("id")
      )
    `);

    // iep_plan_versions
    await queryRunner.query(`
      CREATE TABLE "iep_plan_versions" (
        "id" SERIAL NOT NULL,
        "planId" integer NOT NULL,
        "snapshot" jsonb NOT NULL,
        "createdBy" integer NOT NULL DEFAULT 0,
        "changeReason" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_iep_plan_versions" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "iep_plan_versions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "pii_access_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "abc_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fba_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "risk_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "early_warning_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rti_assessments"`);
    await queryRunner.query(`ALTER TABLE "iep_plans" DROP COLUMN "version"`);
    await queryRunner.query(`ALTER TABLE "iep_plans" DROP COLUMN "plopData"`);
    await queryRunner.query(`ALTER TABLE "iep_plans" DROP COLUMN "plop"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "riskScoreUpdatedAt"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "riskScore"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "rtiTierAssessedAt"`);
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "rtiTier"`);
  }
}
