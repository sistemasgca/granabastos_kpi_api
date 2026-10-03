import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('Configura DATABASE_URL antes de crear el administrador.');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
    throw new Error('Ejecuta este comando desde una terminal interactiva.');
  }

  stdout.write(question);
  stdin.setEncoding('utf8');
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = '';
    const onData = (key) => {
      if (key === '\u0003') {
        cleanup();
        reject(new Error('Operación cancelada.'));
      } else if (key === '\r' || key === '\n') {
        cleanup();
        stdout.write('\n');
        resolve(value);
      } else if (key === '\u007f' || key === '\b') {
        value = value.slice(0, -1);
      } else if (key >= ' ') {
        value += key;
      }
    };
    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.on('data', onData);
  });
}

try {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    throw new Error(
      'Ya existen usuarios. Crea las siguientes cuentas desde POST /api/auth/users con un token ADMIN.',
    );
  }

  const terminal = createInterface({ input: stdin, output: stdout });
  const email = (await terminal.question('Correo del administrador: '))
    .trim()
    .toLowerCase();
  const name = (await terminal.question('Nombre del administrador: ')).trim();
  terminal.close();

  const password = await askHidden('Contraseña (mínimo 12 caracteres): ');
  if (password.length < 12) {
    throw new Error('La contraseña debe tener al menos 12 caracteres.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('La contraseña no puede superar 72 bytes en UTF-8.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    throw new Error('Ingresa un correo válido y un nombre no vacío.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.user.create({
    data: { email, name, passwordHash, role: 'ADMIN' },
    select: { id: true, email: true, name: true, role: true },
  });
  console.log(`Administrador creado: ${admin.email} (${admin.id}).`);
} finally {
  await prisma.$disconnect();
  await pool.end();
}
