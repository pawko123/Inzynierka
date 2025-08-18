import { MigrationInterface, QueryRunner } from 'typeorm';

export class Addedcascadetochannelpermission1754508446014 implements MigrationInterface {
	name = 'Addedcascadetochannelpermission1754508446014';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "channel_permission" DROP CONSTRAINT "FK_0f12128f2217bd66453f20292ea"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" ADD CONSTRAINT "FK_0f12128f2217bd66453f20292ea" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "channel_permission" DROP CONSTRAINT "FK_0f12128f2217bd66453f20292ea"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" ADD CONSTRAINT "FK_0f12128f2217bd66453f20292ea" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
