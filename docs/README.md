# ReservaFácil

API REST para gestionar el inventario de habitaciones de un hotel boutique.

## Estado del proyecto

🚧 La base de NestJS está disponible. La lógica de negocio y la persistencia aún no están integradas.

## Arranque local

Requiere Node.js 22.18+ (serie 22) o 24+. Desde la raíz del repositorio:

```powershell
npm ci
Copy-Item .env.example .env
npm run build
npm start
```

`GET http://localhost:3000/health` devuelve `200` con `{"status":"ok"}`. `PORT` permite cambiar el puerto. El archivo `.env` es local; las variables `DB_*` quedan reservadas para la conexión a MySQL, que todavía no es necesaria para arrancar.

Comprobaciones: `npm test`, `npm run lint` y `npm run format:check`.

## Stack objetivo

- Node.js + NestJS
- MySQL
- Jest (unit) + Playwright (E2E)

## Documentación

- [Especificación](./spec.md)
- [Plan de implementación](./plan.md)
