import { prisma } from '../src/prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * Скрипт для призначення користувача SUPER_ADMIN
 * 
 * Використання:
 *   npm run make-super-admin -- --email user@example.com
 */

function generatePassword(): string {
  // Generate a strong random password: 24 characters
  // Mix of uppercase, lowercase, numbers, and safe special characters
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  const passwordChars: string[] = [];
  const randomBytes = crypto.randomBytes(24);
  
  passwordChars.push(uppercase[randomBytes[0] % uppercase.length]);
  passwordChars.push(lowercase[randomBytes[1] % lowercase.length]);
  passwordChars.push(numbers[randomBytes[2] % numbers.length]);
  passwordChars.push(special[randomBytes[3] % special.length]);
  
  // Fill the rest with random characters using crypto
  for (let i = passwordChars.length; i < 24; i++) {
    passwordChars.push(allChars[randomBytes[i] % allChars.length]);
  }
  
  // Shuffle the password using Fisher-Yates with crypto
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomBytes[i] % (i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }
  
  return passwordChars.join('');
}

async function makeSuperAdmin() {
  const args = process.argv.slice(2);
  
  if (args.length < 2 || args[0] !== '--email' || !args[1]) {
    console.error('Використання: npm run make-super-admin -- --email user@example.com');
    process.exit(1);
  }

  const email = args[1];

  // Basic email validation
  if (!email.includes('@')) {
    console.error('Помилка: невалідний email');
    process.exit(1);
  }

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (existingUser) {
      // User exists - update role
      if (existingUser.role === 'SUPER_ADMIN') {
        console.log(`✅ Користувач ${existingUser.email} вже є SUPER_ADMIN`);
        process.exit(0);
      }

      const updated = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'SUPER_ADMIN' },
      });

      console.log(`✅ Користувач ${updated.email} тепер SUPER_ADMIN!`);
      console.log(`   Роль змінено з ${existingUser.role} на SUPER_ADMIN`);
    } else {
      // User does not exist - create with generated password
      const password = generatePassword();
      const passwordHash = await bcrypt.hash(password, 10);
      const username = email.split('@')[0];

      const newUser = await prisma.user.create({
        data: {
          email,
          passwordHash,
          username,
          role: 'SUPER_ADMIN',
        },
      });

      console.log(`✅ Створено нового користувача ${newUser.email} з роллю SUPER_ADMIN`);
      console.log('');
      console.log('⚠️  ВАЖЛИВО: Збережіть цей пароль! Він більше не буде показано.');
      console.log('');
      console.log(`   Email: ${newUser.email}`);
      console.log(`   Пароль: ${password}`);
      console.log('');
    }
  } catch (error) {
    console.error('Помилка:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeSuperAdmin();

