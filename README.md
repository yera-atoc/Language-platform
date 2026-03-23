# Lang Platform

Многоязычная образовательная платформа для изучения языков с нуля до профессионального уровня.

## Языки

| Язык | Экзамен | Статус |
|------|---------|--------|
| 🇹🇷 Турецкий | ТОМЕР | ✅ Фаза 1 |
| 🇨🇳 Китайский | HSK | 🔜 Фаза 2 |
| 🇰🇷 Корейский | TOPIK | 🔜 Фаза 2 |
| 🇸🇦 Арабский | — | 🔜 Фаза 3 |
| 🇪🇸 Испанский | DELE | 🔜 Фаза 3 |
| 🇮🇹 Итальянский | CILS | 🔜 Фаза 3 |
| 🇯🇵 Японский | JLPT | 🔜 Фаза 3 |

## Стек

- **Frontend**: React 18 + Vite + React Router
- **State**: Zustand
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Деплой**: Netlify (веб) → Capacitor (мобайл) → Electron (десктоп)
- **CI/CD**: GitHub Actions

## Быстрый старт

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/lang-platform.git
cd lang-platform

# 2. Установить зависимости
npm install

# 3. Настроить Firebase
cp .env.example .env
# Заполни .env своими ключами из Firebase Console

# 4. Запустить
npm run dev
```

## Структура контента

Весь учебный контент хранится в `/content` в формате JSON:

```
content/
  turkish/
    index.json        ← список уроков по уровням
    a1/
      lesson_1.json   ← урок с упражнениями
      lesson_2.json
    tomer-prep/       ← пробные тесты ТОМЕР
```

## Геймификация

- **XP** — за каждый пройденный урок
- **Уровни** — A1 → A2 → B1 → B2 → C1 → C2
- **Стрики** — ежедневные занятия
- **Жизни** — 5 попыток на ошибки
- **Достижения** — бейджи за прогресс
