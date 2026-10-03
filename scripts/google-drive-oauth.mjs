import 'dotenv/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { google } from 'googleapis';

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const redirectUri = 'http://localhost:53682/oauth2callback';

if (!clientId || !clientSecret) {
  throw new Error(
    'Configura GOOGLE_OAUTH_CLIENT_ID y GOOGLE_OAUTH_CLIENT_SECRET en .env antes de autorizar.',
  );
}

const oauth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const state = randomBytes(32).toString('hex');
const authorizationUrl = oauth.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
  state,
});

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', redirectUri);
  if (url.pathname !== '/oauth2callback') {
    response.writeHead(404).end('Not found');
    return;
  }

  const receivedState = url.searchParams.get('state') ?? '';
  const stateMatches =
    receivedState.length === state.length &&
    timingSafeEqual(Buffer.from(receivedState), Buffer.from(state));
  const authorizationCode = url.searchParams.get('code');
  if (!stateMatches || !authorizationCode) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(
      'Autorización cancelada o inválida. Cierra esta ventana y revisa la terminal.',
    );
    server.close();
    console.error(
      url.searchParams.get('error') ??
        'Google no devolvió un código de autorización válido.',
    );
    process.exitCode = 1;
    return;
  }

  try {
    const { tokens } = await oauth.getToken(authorizationCode);
    if (!tokens.refresh_token) {
      throw new Error(
        'Google no devolvió un refresh token. Revoca el acceso de esta aplicación en tu cuenta de Google y vuelve a ejecutar el comando.',
      );
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(
      '<p>Autorización completada. Puedes cerrar esta ventana y copiar el token desde la terminal.</p>',
    );
    console.log('\nGuarda este valor como secreto en el .env local:\n');
    console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\nNo compartas este token ni lo guardes en Git.');
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(
      'No fue posible completar la autorización. Revisa el error en la terminal.',
    );
    console.error('No se pudo intercambiar el código OAuth:', error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});

server.listen(53682, '127.0.0.1', () => {
  console.log('Abre esta URL e inicia sesión con la cuenta personal de Drive:\n');
  console.log(authorizationUrl);
  console.log('\nEsperando la autorización local en http://localhost:53682 ...');
});
