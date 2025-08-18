import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedLogoToServer1754233043658 implements MigrationInterface {
	name = 'AddedLogoToServer1754233043658';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "server" ADD "logo" text`);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "server" DROP COLUMN "logo"`);
	}
}
