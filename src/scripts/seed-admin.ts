import 'reflect-metadata';
import { hash } from 'bcrypt';
import type { StaffRole } from '../domain/stay-state-machine';
import { StaffUser } from '../infrastructure/persistence/typeorm/entities/staff-user.entity';
import dataSource from '../infrastructure/persistence/typeorm/ormconfig';

// Credencial conocida: solo para desarrollo y pruebas de autenticación.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_ROLE: StaffRole = 'administrador';
const BCRYPT_ROUNDS = 10;

async function seedAdmin(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`No se crea '${ADMIN_USERNAME}' con una contraseña conocida cuando NODE_ENV=production.`);
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(StaffUser);

    const existing = await users.findOne({ where: { username: ADMIN_USERNAME } });
    if (existing) {
      console.log(`El usuario '${ADMIN_USERNAME}' ya existe (id=${existing.id}); no se realizaron cambios.`);
      return;
    }

    const passwordHash = await hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
    const admin = await users.save(users.create({ username: ADMIN_USERNAME, passwordHash, role: ADMIN_ROLE }));
    console.log(`Usuario '${admin.username}' creado (id=${admin.id}, rol=${admin.role}).`);
  } finally {
    await dataSource.destroy();
  }
}

seedAdmin().catch((error: unknown) => {
  // Solo el mensaje: los errores de TypeORM incluyen los parámetros de la consulta (el hash).
  console.error(`seed-admin falló: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
