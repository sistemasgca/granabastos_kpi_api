# Autenticacion y permisos

## Roles

| Rol | Permisos |
| --- | --- |
| `VIEWER` | Consultar recursos y alertas. |
| `EDITOR` | Consultar; registrar mediciones; crear, actualizar y eliminar tareas, planes y actividades POA. |
| `ADMIN` | Todos los permisos, incluidas la administracion de usuarios y la edicion de la ficha y metas del KPI. |

Todas las rutas requieren un token Bearer, excepto `GET /api` y `POST /api/auth/login`.
El rol se obtiene de la base de datos en cada solicitud; desactivar una cuenta retira
el acceso inmediatamente. Cambiar la contrasena invalida los tokens anteriores.

## Configuracion local

1. Usa una base PostgreSQL de desarrollo. No apliques la migracion nueva a una base
   compartida o productiva sin aprobacion y respaldo.
2. Configura el `.env` del backend con la URL de esa base, el puerto `3001`,
   `FRONTEND_URL=http://localhost:3000` y un `JWT_SECRET` aleatorio de al menos
   32 bytes. No guardes credenciales en Git.
3. Aplica las migraciones y genera el cliente:

   ```powershell
   npx prisma migrate dev
   npx prisma generate
   ```

4. Crea el primer administrador. Solo se permite cuando la base no tiene usuarios;
   el password se solicita sin mostrarlo en pantalla:

   ```powershell
   npm run auth:create-admin
   ```

5. Inicia la API:

   ```powershell
   npm run start:dev
   ```

## Flujo de prueba en Postman

1. Inicia sesion con `POST http://localhost:3001/api/auth/login`:

   ```json
   {
     "email": "admin@granabastos.com.co",
     "password": "la-contrasena-del-admin"
   }
   ```

2. Copia `accessToken`; en Postman, abre Authorization y selecciona Bearer Token.
3. Verifica la sesion con `GET /api/auth/me`.
4. Como administrador, crea un usuario con `POST /api/auth/users`:

   ```json
   {
     "email": "editor@granabastos.com.co",
     "name": "Editor KPI",
     "password": "UnaClaveLarga123!",
     "role": "EDITOR"
   }
   ```

5. Lista usuarios con `GET /api/auth/users` y actualiza rol o estado con
   `PATCH /api/auth/users/{id}`. Un administrador no puede desactivar al ultimo
   administrador activo ni desactivar su propia cuenta.
6. Cambia la contrasena autenticado con `POST /api/auth/change-password`:

   ```json
   {
     "currentPassword": "la-contrasena-actual",
     "newPassword": "OtraClaveLarga123!"
   }
   ```

   Ese cambio invalida los tokens anteriores; vuelve a iniciar sesion.

Los errores esperados son `401` para token o credenciales no validos, `403` cuando
el rol no tiene permiso, `400` para DTOs invalidos y `409` para correo duplicado.

## Auditoria

Cada medicion guarda el usuario creador y una copia de su nombre en
`registeredBy`. Los planes de accion guardan `createdById` y `updatedById`.
La contrasena se almacena como hash bcrypt y nunca se devuelve en respuestas.

## Migracion a un entorno ya poblado

La migracion agrega usuarios y referencias opcionales; no crea cuentas iniciales
ni cambia los registros de KPIs. Los registros historicos existentes quedan con
creador nulo. Aplica `npx prisma migrate deploy` solo al desplegar una migracion
ya probada sobre la base y despues de contar con respaldo.
