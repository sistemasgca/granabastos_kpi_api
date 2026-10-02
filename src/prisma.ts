import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Configuramos el pool de conexiones clásico de PostgreSQL de la librería 'pg'
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 2. Instanciamos el Driver Adapter pasándole el pool de conexiones directamente
const adapter = new PrismaPg(pool);

// 3. Inicializamos Prisma Client inyectándole el adaptador
const prisma = new PrismaClient({ adapter });

export default prisma;
