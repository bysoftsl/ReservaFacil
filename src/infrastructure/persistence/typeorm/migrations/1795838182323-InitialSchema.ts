import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1795838182323 implements MigrationInterface {
  name = 'InitialSchema1795838182323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`availability_guard\` (\`id\` bigint UNSIGNED NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`staff_user\` (\`id\` bigint UNSIGNED NOT NULL AUTO_INCREMENT, \`username\` varchar(100) NOT NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` enum ('administrador', 'recepcionista') NOT NULL, \`active\` tinyint NOT NULL DEFAULT 1, UNIQUE INDEX \`uq_staff_user_username\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    // Fixed control row that availability writes lock with SELECT ... FOR UPDATE (ADR-002).
    await queryRunner.query(`INSERT INTO \`availability_guard\` (\`id\`) VALUES (1)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`uq_staff_user_username\` ON \`staff_user\``);
    await queryRunner.query(`DROP TABLE \`staff_user\``);
    await queryRunner.query(`DROP TABLE \`availability_guard\``);
  }
}
