import { prisma } from '../src/prisma/client';

/**
 * Скрипт для зміни ролі користувача на ADMIN
 * 
 * Використання:
 *   npx ts-node scripts/make-admin.ts <email>
 * 
 * Або для конкретного ID:
 *   npx ts-node scripts/make-admin.ts --id <user-id>
 */

async function makeAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Використання: npx ts-node scripts/make-admin.ts <email>');
    console.error('Або: npx ts-node scripts/make-admin.ts --id <user-id>');
    process.exit(1);
  }

  try {
    let user;
    
    if (args[0] === '--id' && args[1]) {
      // Знайти за ID
      user = await prisma.user.findUnique({
        where: { id: args[1] },
      });
    } else {
      // Знайти за email
      user = await prisma.user.findUnique({
        where: { email: args[0] },
      });
    }

    if (!user) {
      console.error('Користувача не знайдено');
      process.exit(1);
    }

    if (user.role === 'ADMIN') {
      console.log(`Користувач ${user.email} вже є адміном`);
      process.exit(0);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    });

    console.log(`✅ Користувач ${updated.email} тепер адмін!`);
  } catch (error) {
    console.error('Помилка:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();

