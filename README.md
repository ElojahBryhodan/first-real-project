# PvP Platform

Платформа для створення та управління PvP матчами з системою виплат та адміністративним панелем.

## 🚀 Особливості

- **P0 (Базова функціональність)**
  - Реєстрація та авторизація користувачів
  - Створення та приєднання до матчів
  - Система виплат та комісій
  - Ведення балансу користувачів

- **P1 (Адміністративні функції)**
  - Система спірів (disputes)
  - Адмін панель для вирішення спірів
  - Управління користувачами та матчами
  - Налаштування комісії платформи

- **P2 (UX покращення)**
  - Пагінація списку матчів
  - Статистика платформи
  - Покращені індикатори завантаження
  - Покращені empty states

## 📋 Технології

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT автентифікація

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

## 🛠️ Встановлення

### Backend

```bash
cd backend
npm install
cp .env.example .env  # Налаштуйте DATABASE_URL та JWT_SECRET
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd react-tailwind-app
npm install
npm run dev
```

## 🔧 Налаштування

### Змінні середовища (Backend)

Створіть файл `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="your-secret-key"
CORS_ORIGIN="http://localhost:5173"
```

### Змінні середовища (Frontend)

Створіть файл `react-tailwind-app/.env`:

```env
VITE_API_URL="http://localhost:4000"
```

## 👤 Створення адміністратора

```bash
cd backend
npm run make-admin your-email@example.com
```

Або через SQL:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 📦 Деплой

### GitHub Pages

Проєкт автоматично деплоїться на GitHub Pages при push в master гілку через GitHub Actions.

Або вручну:

```bash
cd react-tailwind-app
npm run deploy
```

## 📁 Структура проєкту

```
.
├── backend/              # Backend API
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── middleware/  # Auth, admin, error handlers
│   │   └── prisma/      # Prisma client
│   ├── prisma/          # Prisma schema & migrations
│   └── scripts/         # Utility scripts
│
└── react-tailwind-app/  # Frontend React app
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/       # Page components
    │   └── App.tsx      # Main app component
    └── public/          # Static assets
```

## 🔐 API Endpoints

### Автентифікація
- `POST /api/auth/register` - Реєстрація
- `POST /api/auth/login` - Вхід
- `GET /api/auth/me` - Поточний користувач

### Матчі
- `GET /api/matches` - Список матчів (з пагінацією)
- `GET /api/matches/:id` - Деталі матчу
- `POST /api/matches` - Створити матч
- `POST /api/matches/:id/join` - Приєднатися до матчу
- `POST /api/matches/:id/finish` - Завершити матч
- `POST /api/matches/:id/dispute` - Позначити як спірний

### Статистика
- `GET /api/stats` - Статистика платформи

### Адмін (тільки для ADMIN)
- `GET /api/admin/matches` - Всі матчі
- `GET /api/admin/users` - Всі користувачі
- `POST /api/admin/matches/:id/resolve` - Вирішити спір
- `GET /api/admin/config` - Налаштування платформи
- `PUT /api/admin/config/commission` - Оновити комісію

## 📝 Ліцензія

MIT

