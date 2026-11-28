# ReservaFácil

API REST para gestionar el inventario de habitaciones de un hotel boutique.

## Estado del proyecto

🚧 La base de NestJS está disponible, con conexión a MySQL/MariaDB y la primera migración. La lógica de negocio aún no está integrada.

## Arranque local

Requiere Node.js 22.18+ (serie 22) o 24+ y una base de datos MySQL/MariaDB vacía (`utf8mb4`). Desde la raíz del repositorio:

```powershell
npm ci
Copy-Item .env.example .env   # completa DB_NAME, DB_USER y DB_PASSWORD
npm run build
npm run migration:run
npm start
```

`GET http://localhost:3000/health` devuelve `200` con `{"status":"ok"}`. `PORT` permite cambiar el puerto. El archivo `.env` es local y no se versiona; las variables `DB_*` son obligatorias y la aplicación no arranca sin una base accesible.

Migraciones (compilan antes de ejecutarse): `npm run migration:generate -- src/infrastructure/persistence/typeorm/migrations/<Nombre>`, `npm run migration:run` y `npm run migration:revert`.

Comprobaciones: `npm test` (las pruebas de integración usan la base de `.env` ya migrada), `npm run lint` y `npm run format:check`.

## Stack objetivo

- Node.js + NestJS
- MySQL
- Jest (unit) + Playwright (E2E)

## Documentación

- [Especificación](./spec.md)
- [Plan de implementación](./plan.md)
