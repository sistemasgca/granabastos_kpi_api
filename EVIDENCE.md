# Evidencias en Google Drive

Los archivos se mantienen privados. La API guarda en PostgreSQL el identificador de
Drive y los metadatos, y transmite las descargas solo a usuarios autenticados. El
campo `externalUrl` no concede acceso público; los clientes deben usar el endpoint
de descarga de la API.

## Preparar Google Drive

1. En Google Cloud Console, crea o selecciona un proyecto y habilita **Google Drive
   API**.
2. Configura la pantalla de consentimiento OAuth y crea un **OAuth client ID** de
   tipo **Desktop app**. Si la aplicación está en modo de prueba, agrega como usuario
   de prueba la cuenta personal que guardará las evidencias.
3. En el `.env` local del backend configura el ID y el secreto del cliente OAuth, y
   el ID de la carpeta raíz en **Mi unidad**:

   ```env
   GOOGLE_OAUTH_CLIENT_ID="...apps.googleusercontent.com"
   GOOGLE_OAUTH_CLIENT_SECRET="..."
   GOOGLE_DRIVE_ROOT_FOLDER_ID="id-de-la-carpeta-raiz"
   ```

   Para obtener el ID de carpeta, abre la carpeta raíz en Drive y copia el segmento
   final de la URL. En la estructura de la captura, usa el ID de la carpeta padre
   `Evidencias_Granabastos`; la API busca o crea debajo de ella la carpeta del KPI,
   el año y el trimestre.
4. Desde la raíz del backend ejecuta:

   ```powershell
   npm run google-drive:authorize
   ```

   Se abrirá una URL de Google en la terminal. Ábrela en el navegador, inicia sesión
   con la cuenta personal propietaria de las carpetas y concede acceso a Drive. Al
   finalizar, el script mostrará un `GOOGLE_REFRESH_TOKEN`; agrégalo al `.env`:

   ```env
   GOOGLE_REFRESH_TOKEN="token-generado"
   ```

   Trata el refresh token como una contraseña: no lo compartas ni lo subas a Git.
   Reinicia NestJS después de agregarlo. La API usará OAuth como tu cuenta personal,
   por lo que los archivos consumirán la cuota de almacenamiento de esa cuenta.

El alcance OAuth `drive` permite que la API encuentre y cree subcarpetas dentro de
la carpeta raíz seleccionada. Autoriza solo una cuenta que quieras usar para este
backend. En aplicaciones OAuth externas que permanezcan en modo de prueba, Google
puede caducar los refresh tokens después de siete días; para uso continuo, revisa
el estado de publicación y verificación OAuth del proyecto. Ya no se requiere la
cuenta de servicio para cargar estos archivos.

Si anteriormente configuraste una clave de cuenta de servicio y la compartiste,
revócala en Google Cloud Console. Elimina `GOOGLE_SERVICE_ACCOUNT_EMAIL` y
`GOOGLE_PRIVATE_KEY` del `.env`; esta integración OAuth ya no los utiliza.

## Migración y ejecución

Esta versión agrega el usuario que cargó cada evidencia y un índice por medición.
Con una base **local/de desarrollo**, aplica la migración y genera el cliente:

```powershell
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

No ejecutes la migración en la base Neon configurada para este proyecto sin
autorización, respaldo y una ventana de despliegue aprobada.

## Probar desde Postman

Inicia sesión y configura `Authorization: Bearer <accessToken>`. Como usuario
`EDITOR` o `ADMIN`, carga una evidencia:

- Método: `POST`
- URL: `http://localhost:3001/api/measurements/<measurementId>/attachments`
- Body: `form-data`
- Clave: `file` (tipo **File**); selecciona un PDF, PNG, JPG, WEBP, CSV, XLS, XLSX
  o DOCX de hasta 10 MB.

La respuesta incluye `id`, metadatos y `downloadUrl`. Para descargar, usa el GET de
esa URL con el mismo token. Para listar evidencias de una medición:
`GET /api/measurements/<measurementId>/attachments`. Solo `ADMIN` puede borrar una
evidencia con `DELETE /api/attachments/<attachmentId>`.

Los documentos, imágenes y hojas de cálculo se validan por contenido, además de por
extensión. Las descargas pasan por la API y no exponen permisos anónimos de Drive.
