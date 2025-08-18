import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedCascade1754223219480 implements MigrationInterface {
	name = 'AddedCascade1754223219480';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3130a39c1e4a740d044e685730"`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" DROP CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad"`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" DROP CONSTRAINT "FK_c92e54788d8adffb89c618062c9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" DROP CONSTRAINT "FK_5fdbbcb32afcea663c2bea2954f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" DROP CONSTRAINT "FK_c0d05f3ae5c2576c020d6042d79"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" DROP CONSTRAINT "FK_283e08438bfd80be20d9299d906"`,
		);
		await queryRunner.query(
			`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3130a39c1e4a740d044e685730" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" ADD CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad" FOREIGN KEY ("memberId") REFERENCES "server_member"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" ADD CONSTRAINT "FK_c92e54788d8adffb89c618062c9" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_5fdbbcb32afcea663c2bea2954f" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" ADD CONSTRAINT "FK_c0d05f3ae5c2576c020d6042d79" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" ADD CONSTRAINT "FK_283e08438bfd80be20d9299d906" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "channel_permission" DROP CONSTRAINT "FK_283e08438bfd80be20d9299d906"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" DROP CONSTRAINT "FK_c0d05f3ae5c2576c020d6042d79"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" DROP CONSTRAINT "FK_5fdbbcb32afcea663c2bea2954f"`,
		);
		await queryRunner.query(
			`ALTER TABLE "message_attachment" DROP CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef"`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" DROP CONSTRAINT "FK_c92e54788d8adffb89c618062c9"`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" DROP CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad"`,
		);
		await queryRunner.query(
			`ALTER TABLE "role_permission" DROP CONSTRAINT "FK_e3130a39c1e4a740d044e685730"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" ADD CONSTRAINT "FK_283e08438bfd80be20d9299d906" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" ADD CONSTRAINT "FK_c0d05f3ae5c2576c020d6042d79" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_5fdbbcb32afcea663c2bea2954f" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" ADD CONSTRAINT "FK_c92e54788d8adffb89c618062c9" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" ADD CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad" FOREIGN KEY ("memberId") REFERENCES "server_member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3130a39c1e4a740d044e685730" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}
}
