import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangedCascade1754222497354 implements MigrationInterface {
	name = 'ChangedCascade1754222497354';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "role" DROP CONSTRAINT "FK_d9e438d88cfb64f7f8e1ae593c3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" DROP CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel" DROP CONSTRAINT "FK_656efd5d40c72d70f0e63293966"`,
		);
		await queryRunner.query(
			`ALTER TABLE "role" ADD CONSTRAINT "FK_d9e438d88cfb64f7f8e1ae593c3" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" ADD CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel" ADD CONSTRAINT "FK_656efd5d40c72d70f0e63293966" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "channel" DROP CONSTRAINT "FK_656efd5d40c72d70f0e63293966"`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" DROP CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729"`,
		);
		await queryRunner.query(
			`ALTER TABLE "role" DROP CONSTRAINT "FK_d9e438d88cfb64f7f8e1ae593c3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel" ADD CONSTRAINT "FK_656efd5d40c72d70f0e63293966" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" ADD CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "role" ADD CONSTRAINT "FK_d9e438d88cfb64f7f8e1ae593c3" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
