# 🚀 Інструкція по деплою на GitHub Pages

## Крок 1: Увімкнення GitHub Pages

1. Перейдіть в налаштування репозиторію:
   ```
   https://github.com/ElojahBryhodan/first-real-project/settings/pages
   ```

2. У розділі **"Source"**:
   - Виберіть: **"GitHub Actions"** (не "Deploy from a branch")
   - Збережіть зміни

## Крок 2: Автоматичний деплой

Після увімкнення GitHub Pages, при кожному push в `master` гілку:
- Автоматично запуститься GitHub Actions workflow
- Збудується React додаток
- Задеплоїться на GitHub Pages

## Крок 3: Перевірка деплою

1. Перевірте статус workflow:
   ```
   https://github.com/ElojahBryhodan/first-real-project/actions
   ```

2. Після успішного деплою сайт буде доступний:
   ```
   https://elojahbryhodan.github.io/first-real-project/
   ```

## ⚠️ Важливо для production

### Налаштування API URL

Для роботи з backend API на production, потрібно:

1. **Варіант 1: Використовувати хостинг для backend**
   - Задеплоїти backend на Heroku, Railway, або інший хостинг
   - Оновити `VITE_API_URL` в змінних середовища GitHub Actions

2. **Варіант 2: Використовувати CORS**
   - Налаштувати CORS на backend для дозволу запитів з GitHub Pages домену

### Оновлення API URL в workflow

Якщо потрібно змінити API URL для production, відредагуйте `.github/workflows/deploy.yml`:

```yaml
- name: Build
  working-directory: ./react-tailwind-app
  env:
    NODE_ENV: production
    VITE_API_URL: https://your-backend-url.com  # Додайте тут
  run: npm run build
```

## 🔧 Ручний деплой (якщо потрібно)

```bash
cd react-tailwind-app
npm run build
npm run deploy
```

## 📝 Примітки

- Сайт буде доступний за адресою: `https://elojahbryhodan.github.io/first-real-project/`
- Base path автоматично налаштований в `vite.config.js`
- React Router працює з base path через налаштування в `vite.config.js`

