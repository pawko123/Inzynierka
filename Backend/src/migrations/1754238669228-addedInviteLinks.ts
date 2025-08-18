import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedInviteLinks1754238669228 implements MigrationInterface {
	name = 'AddedInviteLinks1754238669228';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "server_invite" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "expiresAt" TIMESTAMP, "uses" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "serverId" uuid, CONSTRAINT "UQ_7da6c2c0cbb6350a36964a1b64e" UNIQUE ("code"), CONSTRAINT "PK_69a305ef30aec758f49e6c4bf84" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_invite" ADD CONSTRAINT "FK_487cfff3d6c73d2590ed589cd29" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "server_invite" DROP CONSTRAINT "FK_487cfff3d6c73d2590ed589cd29"`,
		);
		await queryRunner.query(`DROP TABLE "server_invite"`);
	}
}
