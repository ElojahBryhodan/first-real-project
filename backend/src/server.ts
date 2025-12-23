import { app } from './app';
import { env } from './utils/env';
import { prisma } from './prisma/client';

async function main() {
  try {
    await prisma.$connect();
    console.log('[db] Connected to PostgreSQL');
  } catch (err) {
    console.error('[db] Connection failed', err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`[server] Listening on http://localhost:${env.PORT}`);
  });
}

void main();


