import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1752950372838 implements MigrationInterface {
	name = 'Initial1752950372838';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE "role_permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "permission" character varying NOT NULL, "roleId" uuid, CONSTRAINT "PK_96c8f1fd25538d3692024115b47" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "member_role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "memberId" uuid, "roleId" uuid, CONSTRAINT "PK_33b2aec0c43fcad85595baa1d9e" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "message_attachment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileName" character varying NOT NULL, "fileType" character varying NOT NULL, "url" character varying NOT NULL, "size" integer, "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(), "messageId" uuid, CONSTRAINT "PK_d5bc54379802d99c07cd7ec00e4" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "sentAt" TIMESTAMP NOT NULL DEFAULT now(), "channelId" uuid, "senderId" uuid, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "channel_participant" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "channelId" uuid, "userId" uuid, CONSTRAINT "PK_ae5e5f3f9ce9a1968392ebb6b08" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "channel" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL DEFAULT 'text', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "isDirect" boolean NOT NULL DEFAULT false, "serverId" uuid, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "channel_permission" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "permission" character varying NOT NULL, "allow" boolean NOT NULL, "channelId" uuid, "roleId" uuid, CONSTRAINT "PK_4201c1a11e8011ee479d20e3c1b" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "role" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "color" character varying, "isDefault" boolean NOT NULL DEFAULT false, "serverId" uuid, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "server" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "ownerId" uuid, CONSTRAINT "PK_f8b8af38bdc23b447c0a57c7937" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "server_member" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "serverId" uuid, CONSTRAINT "PK_310a1c369f7913dd767e58d27e6" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`CREATE TABLE "voice_state" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isMuted" boolean NOT NULL DEFAULT false, "isDeafened" boolean NOT NULL DEFAULT false, "joinedAt" TIMESTAMP NOT NULL DEFAULT now(), "leftAt" TIMESTAMP, "userId" uuid, "channelId" uuid, CONSTRAINT "PK_2d6ff2c0d6eed42d036c0365aac" PRIMARY KEY ("id"))`,
		);
		await queryRunner.query(
			`ALTER TABLE "role_permission" ADD CONSTRAINT "FK_e3130a39c1e4a740d044e685730" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" ADD CONSTRAINT "FK_0fbb6acc021c683d9f9c73661ad" FOREIGN KEY ("memberId") REFERENCES "server_member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "member_role" ADD CONSTRAINT "FK_c92e54788d8adffb89c618062c9" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message_attachment" ADD CONSTRAINT "FK_2ac7499c95ef4f2b7cf2f0f26ef" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_5fdbbcb32afcea663c2bea2954f" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" ADD CONSTRAINT "FK_c0d05f3ae5c2576c020d6042d79" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" ADD CONSTRAINT "FK_64393df3b0cdfd3e26a8a999ab6" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel" ADD CONSTRAINT "FK_656efd5d40c72d70f0e63293966" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" ADD CONSTRAINT "FK_0f12128f2217bd66453f20292ea" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" ADD CONSTRAINT "FK_283e08438bfd80be20d9299d906" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "role" ADD CONSTRAINT "FK_d9e438d88cfb64f7f8e1ae593c3" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "server" ADD CONSTRAINT "FK_f6359e2a174368f2787c48618b3" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" ADD CONSTRAINT "FK_f9f9c53e6768e4ad9a7092a3993" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" ADD CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729" FOREIGN KEY ("serverId") REFERENCES "server"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "voice_state" ADD CONSTRAINT "FK_74d65d75dd58f8ffcd87f392a48" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
		await queryRunner.query(
			`ALTER TABLE "voice_state" ADD CONSTRAINT "FK_f2479042534c9e412f85304d386" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`ALTER TABLE "voice_state" DROP CONSTRAINT "FK_f2479042534c9e412f85304d386"`,
		);
		await queryRunner.query(
			`ALTER TABLE "voice_state" DROP CONSTRAINT "FK_74d65d75dd58f8ffcd87f392a48"`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" DROP CONSTRAINT "FK_57806110c6ca99dbd5e6b1dd729"`,
		);
		await queryRunner.query(
			`ALTER TABLE "server_member" DROP CONSTRAINT "FK_f9f9c53e6768e4ad9a7092a3993"`,
		);
		await queryRunner.query(
			`ALTER TABLE "server" DROP CONSTRAINT "FK_f6359e2a174368f2787c48618b3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "role" DROP CONSTRAINT "FK_d9e438d88cfb64f7f8e1ae593c3"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" DROP CONSTRAINT "FK_283e08438bfd80be20d9299d906"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_permission" DROP CONSTRAINT "FK_0f12128f2217bd66453f20292ea"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel" DROP CONSTRAINT "FK_656efd5d40c72d70f0e63293966"`,
		);
		await queryRunner.query(
			`ALTER TABLE "channel_participant" DROP CONSTRAINT "FK_64393df3b0cdfd3e26a8a999ab6"`,
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
		await queryRunner.query(`DROP TABLE "voice_state"`);
		await queryRunner.query(`DROP TABLE "user"`);
		await queryRunner.query(`DROP TABLE "server_member"`);
		await queryRunner.query(`DROP TABLE "server"`);
		await queryRunner.query(`DROP TABLE "role"`);
		await queryRunner.query(`DROP TABLE "channel_permission"`);
		await queryRunner.query(`DROP TABLE "channel"`);
		await queryRunner.query(`DROP TABLE "channel_participant"`);
		await queryRunner.query(`DROP TABLE "message"`);
		await queryRunner.query(`DROP TABLE "message_attachment"`);
		await queryRunner.query(`DROP TABLE "member_role"`);
		await queryRunner.query(`DROP TABLE "role_permission"`);
	}
}
