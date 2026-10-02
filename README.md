# Granabastos KPI API

API para el seguimiento de indicadores clave de desempeño (KPI) de Granabastos. El proyecto está construido con NestJS, TypeScript, Prisma y PostgreSQL.

## Funcionalidad

La API expone operaciones para KPIs, mediciones, tareas de medición, planes de acción, actividades POA y alertas. Las rutas requieren JWT salvo el inicio de sesión y `GET /api`.

Los roles disponibles son `ADMIN`, `EDITOR` y `VIEWER`. Consulta [AUTHENTICATION.md](./AUTHENTICATION.md) para crear el primer administrador, aplicar la migración en una base de desarrollo y probar la API.

## Requisitos

- Node.js y npm
- PostgreSQL

## Configuración

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea un archivo `.env` en la raíz del proyecto y configura la conexión a PostgreSQL:

   ```env
   DATABASE_URL="postgresql://USUARIO:CONTRASENA@localhost:5432/granabastos?schema=public"
   PORT=3000
   ```

   Reemplaza `USUARIO`, `CONTRASENA` y el nombre de la base de datos con tus valores locales. No subas credenciales al repositorio.

3. Aplica las migraciones y genera Prisma Client:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

## Ejecución

Inicia la API en modo desarrollo:

```bash
npm run start:dev
```

La aplicación estará disponible en el puerto configurado en `PORT` (recomendado: `3001` para no interferir con el frontend).

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run start:dev` | Inicia la aplicación en modo desarrollo con recarga automática. |
| `npm run build` | Compila la aplicación. |
| `npm run start:prod` | Ejecuta la aplicación compilada. |
| `npm run lint` | Analiza el código fuente y las pruebas. |
| `npm run test` | Ejecuta las pruebas unitarias. |
| `npm run test:e2e` | Ejecuta las pruebas end-to-end. |

## Tecnologías

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- TypeScript
