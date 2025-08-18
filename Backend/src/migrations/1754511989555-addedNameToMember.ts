import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddedNameToMember1754511989555 implements MigrationInterface {
	name = 'AddedNameToMember1754511989555';

	public async up(queryRunner: QueryRunner): Promise<void> {
		// First add the column as nullable
		await queryRunner.query(`ALTER TABLE "server_member" ADD "memberName" character varying`);

		// Update existing records with the user's username
		await queryRunner.query(`
            UPDATE "server_member" 
            SET "memberName" = "user"."username" 
            FROM "user" 
            WHERE "server_member"."userId" = "user"."id" AND "server_member"."memberName" IS NULL
        `);

		// Now make the column NOT NULL
		await queryRunner.query(
			`ALTER TABLE "server_member" ALTER COLUMN "memberName" SET NOT NULL`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`ALTER TABLE "server_member" DROP COLUMN "memberName"`);
	}
}
