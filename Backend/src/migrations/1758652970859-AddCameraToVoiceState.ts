import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCameraToVoiceState1758652970859 implements MigrationInterface {
    name = 'AddCameraToVoiceState1758652970859'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "voice_state" ADD "isCameraOn" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "voice_state" ADD "isScreenSharing" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "voice_state" DROP COLUMN "isScreenSharing"`);
        await queryRunner.query(`ALTER TABLE "voice_state" DROP COLUMN "isCameraOn"`);
    }

}
