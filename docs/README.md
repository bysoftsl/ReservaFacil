# ReservaFácil

API REST para gestionar el inventario de habitaciones de un hotel boutique.

## Estado del proyecto

🚧 La base de NestJS está disponible, con conexión a MySQL/MariaDB, la primera migración y el inicio de sesión con JWT. La autorización por rol de las rutas protegidas y el resto de la lógica de negocio aún no están integrados.

## Arranque local

Requiere Node.js 22.18+ (serie 22) o 24+ y una base de datos MySQL/MariaDB vacía (`utf8mb4`). Desde la raíz del repositorio:

```powershell
npm ci
Copy-Item .env.example .env   # completa DB_NAME, DB_USER, DB_PASSWORD y JWT_SECRET
npm run build
npm run migration:run
npm start
```

`GET http://localhost:3000/health` devuelve `200` con `{"status":"ok"}`; es la única ruta fuera del prefijo `/api/v1`. `PORT` permite cambiar el puerto. El archivo `.env` es local y no se versiona; las variables `DB_*` y `JWT_SECRET` (mínimo 32 caracteres) son obligatorias y la aplicación no arranca sin una base accesible. `JWT_EXPIRES_IN` (por defecto `1h`, provisional hasta resolver PA-010) fija la duración del token.

Migraciones (compilan antes de ejecutarse): `npm run migration:generate -- src/infrastructure/persistence/typeorm/migrations/<Nombre>`, `npm run migration:run` y `npm run migration:revert`.

Administrador de desarrollo: con la base migrada, `npm run seed:admin` crea el usuario `admin` (rol `administrador`) con la contraseña conocida definida en `src/scripts/seed-admin.ts`, guardada con bcrypt (10 rondas). Si `admin` ya existe no cambia nada y, con `NODE_ENV=production`, se niega a ejecutarse.

Inicio de sesión: `POST http://localhost:3000/api/v1/auth/login` con `{"username":"admin","password":"..."}` devuelve `200` con `{"accessToken":"<JWT>","tokenType":"Bearer","expiresIn":3600}`. Las credenciales no aceptadas (cuenta inexistente, inactiva o contraseña incorrecta) reciben el mismo `400` genérico.

Comprobaciones: `npm test` (las pruebas de integración usan la base de `.env` ya migrada), `npm run lint` y `npm run format:check`.

## Stack objetivo

- Node.js + NestJS
- MySQL
- Jest (unit) + Playwright (E2E)

## Documentación

- [Especificación](./spec.md)
- [Plan de implementación](./plan.md)
