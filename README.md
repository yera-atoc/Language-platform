# 🌍 Lang Platform

> Многоязычная образовательная платформа для изучения языков с нуля до профессионального уровня — с геймификацией, пробными экзаменами и синхронизацией прогресса.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?logo=netlify&logoColor=white)

---

## Содержание

- [Языки](#языки)
- [Возможности](#возможности)
- [Стек технологий](#стек-технологий)
- [Быстрый старт](#быстрый-старт)
- [Структура проекта](#структура-проекта)
- [Формат контента](#формат-контента)
- [Синхронизация с Firestore](#синхронизация-с-firestore)
- [Деплой](#деплой)
- [Переменные окружения](#переменные-окружения)
- [Roadmap](#roadmap)

---

## Языки

| Язык | Экзамен | Уровни | Статус |
|------|---------|--------|--------|
| 🇹🇷 Турецкий | ТОМЕР | A1 → B2 | ✅ Фаза 1 — готово |
| 🇨🇳 Китайский | HSK 1–6 | A1 → C1 | 🔜 Фаза 2 |
| 🇰🇷 Корейский | TOPIK I/II | A1 → B2 | 🔜 Фаза 2 |
| 🇸🇦 Арабский | — | A1 → B2 | 🔜 Фаза 3 |
| 🇪🇸 Испанский | DELE | A1 → C1 | 🔜 Фаза 3 |
| 🇮🇹 Итальянский | CILS | A1 → C1 | 🔜 Фаза 3 |
| 🇯🇵 Японский | JLPT N5–N1 | A1 → C1 | 🔜 Фаза 3 |

---

## Возможности

### Учебный процесс
- **20 уроков на каждый уровень** (A1 → A2 → B1 → B2) с разблокировкой по прогрессу
- **3 типа упражнений**: множественный выбор, заполни пробел, соедини пары
- **Таймер 30 секунд** на каждый вопрос с цветовой индикацией
- **Мгновенный фидбек** с объяснением правила после ответа

### Геймификация
- ⚡ **XP** — опыт за каждый пройденный урок (больше за точность)
- 🔥 **Стрики** — ежедневные занятия поддерживают серию
- ❤️ **Жизни** — 5 попыток, теряются при ошибках и истечении таймера
- 🏆 **Достижения и бейджи** — 12 бейджей, 6 достижений с прогресс-барами

### Подготовка к экзамену
- Экран готовности к ТОМЕР с 4 модулями (Аудирование / Чтение / Письмо / Говорение)
- Пробный тест A1 — 25 вопросов по всем темам курса
- Советы: структура экзамена, проходной балл, где сдавать

### Технические
- 🔐 **Firebase Auth** — Email/Password + Google Sign-In
- ☁️ **Firestore sync** — двусторонняя синхронизация прогресса в реальном времени
- 📱 **PWA** — устанавливается как приложение на телефон
- 🌐 **Multi-device** — прогресс синхронизируется между устройствами через `onSnapshot`

---

## Стек технологий

| Категория | Технология |
|-----------|-----------|
| Frontend | React 18 + Vite 5 |
| Роутинг | React Router v6 |
| Состояние | Zustand (persist в localStorage) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Деплой | Netlify (веб) → Capacitor (мобайл) → Electron (десктоп) |
| CI/CD | GitHub Actions |
| Шрифты | Outfit + DM Mono (Google Fonts) |

---

## Быстрый старт

### Требования
- Node.js 20+
- npm 10+
- Firebase аккаунт

### Установка

```bash
# 1. Клонировать или распаковать архив
git clone https://github.com/ВАШ_НИК/lang-platform.git
cd lang-platform

# 2. Установить зависимости
npm install

# 3. Создать .env из шаблона
cp .env.example .env
# Открой .env и заполни Firebase ключами

# 4. Запустить локально
npm run dev
# → http://localhost:3000
```

### Настройка Firebase

1. Зайди на [console.firebase.google.com](https://console.firebase.google.com)
2. Создай проект **lang-platform**
3. Добавь Web-приложение (`</>`) → скопируй `firebaseConfig`
4. **Authentication** → Sign-in method → включи Email/Password и Google
5. **Firestore** → создай базу в тестовом режиме (регион: europe-west3)
6. Заполни `.env` скопированными ключами

---

## Структура проекта

```
lang-platform/
├── src/
│   ├── app/
│   │   ├── App.jsx              # Root + Firestore sync
│   │   ├── router.jsx           # Все маршруты
│   │   └── firebase.js          # Firebase инициализация
│   │
│   ├── pages/
│   │   ├── Auth.jsx             # Вход / регистрация
│   │   ├── Home.jsx             # Главный экран
│   │   ├── Lessons.jsx          # Список уроков A1-B2
│   │   ├── Lesson.jsx           # Экран урока с упражнениями
│   │   ├── Progress.jsx         # Статистика и XP
│   │   ├── Profile.jsx          # Профиль, бейджи, настройки
│   │   └── ExamPrep.jsx         # Подготовка к ТОМЕР
│   │
│   ├── hooks/
│   │   ├── useFirestoreSync.js  # Двусторонняя синхронизация
│   │   ├── useSync.js           # Ручное управление sync
│   │   ├── useAuth.js           # Firebase Auth listener
│   │   └── useLesson.js         # Логика урока
│   │
│   ├── store/
│   │   ├── userStore.js         # XP, стрик, жизни (Zustand)
│   │   └── progressStore.js     # Прогресс по урокам (Zustand)
│   │
│   ├── components/
│   │   └── ui/
│   │       └── ProtectedRoute.jsx
│   │
│   └── styles/
│       └── globals.css          # CSS переменные, шрифты
│
├── content/
│   └── turkish/
│       ├── index.json           # Структура курса A1-B2
│       ├── a1/
│       │   ├── lesson_1.json    # Приветствия
│       │   ├── lesson_2.json    # Знакомство
│       │   └── ...              # 20 уроков
│       └── tomer-prep/
│           └── mock_test_a1.json # Пробный тест 25 вопросов
│
├── .github/workflows/
│   └── deploy.yml               # CI/CD → Netlify
│
├── firestore.rules              # Правила безопасности
├── firebase.json                # Firebase CLI config
├── netlify.toml                 # Деплой + headers + cache
├── vite.config.js               # Алиасы @/, @pages/, etc.
├── .env.example                 # Шаблон переменных
└── deploy-first-time.sh         # Скрипт первого деплоя
```

---

## Формат контента

Все уроки хранятся в JSON-файлах в `content/{язык}/{уровень}/lesson_N.json`.

### Структура урока

```json
{
  "id": "lesson_1",
  "title": "Merhaba! — Приветствия",
  "level": "a1",
  "language": "turkish",
  "xpReward": 50,
  "estimatedMinutes": 15,
  "vocabulary": [
    { "tr": "Merhaba", "ru": "Привет", "pronunciation": "мэрхаба" }
  ],
  "exercises": [...]
}
```

### Типы упражнений

**`multiple_choice`** — 4 варианта ответа:
```json
{
  "id": "ex_1",
  "type": "multiple_choice",
  "question": "Что означает слово?",
  "word": "Günaydın",
  "pronun": "[гюнайдын]",
  "options": ["Добрый вечер", "Привет", "Доброе утро", "Пока"],
  "correctAnswer": "Доброе утро",
  "explanation": "Günaydın = Доброе утро."
}
```

**`fill_blank`** — заполни пробел (те же поля, другой вопрос):
```json
{
  "type": "fill_blank",
  "question": "Допиши фразу: «İyi _______» (Добрый день)",
  "options": ["günler", "geceler", "sabahlar", "akşamlar"],
  "correctAnswer": "günler"
}
```

**`match_pairs`** — соедини пары:
```json
{
  "type": "match_pairs",
  "question": "Соедини слова с переводом",
  "pairs": [
    { "left": "Evet", "right": "Да" },
    { "left": "Hayır", "right": "Нет" }
  ],
  "correctAnswer": "all"
}
```

### Добавление нового языка

1. Создай папку `content/{код_языка}/`
2. Добавь `index.json` по образцу `content/turkish/index.json`
3. Создай папки для уровней и JSON-файлы уроков
4. Добавь язык в `LANG_DATA` в `src/pages/Lessons.jsx`
5. Добавь в `LANG_META` и `LANGUAGES` в `src/pages/Home.jsx`

---

## Синхронизация с Firestore

Прогресс хранится в двух местах одновременно:

| Хранилище | Что | Когда |
|-----------|-----|-------|
| `localStorage` | Весь прогресс | Мгновенно (Zustand persist) |
| Firestore `users/{uid}` | XP, уровень, стрик, жизни | Дебаунс 2 сек |
| Firestore `progress/{uid}` | Прогресс по урокам | Дебаунс 2 сек + сразу после урока |

**Схема данных в Firestore:**

```
users/{uid}
  xp: 320
  level: 1
  streak: 7
  lives: 5
  lastActiveDate: "Mon Mar 24 2026"
  achievements: ["first_lesson", "streak_3"]
  updatedAt: Timestamp

progress/{uid}
  lessons:
    turkish:
      a1:
        lesson_1: { completed: true, score: 92, completedAt: "...", attempts: 1 }
        lesson_2: { completed: true, score: 88, ... }
  updatedAt: Timestamp
```

**Принцип синхронизации:**
- При входе: Firestore → Zustand (Firestore побеждает)
- При изменении: Zustand → Firestore (дебаунс 2 сек)
- После урока: немедленный `syncNow()` без дебаунса
- При возврате в вкладку: `pullFromFirestore()` через `visibilitychange`
- Реальное время: `onSnapshot` — изменения с другого устройства применяются мгновенно

---

## Деплой

### Netlify (рекомендуется)

```bash
# Быстрый старт
bash deploy-first-time.sh

# Или вручную
git push origin main
# → GitHub Actions запускает сборку → деплой на Netlify
```

**Обязательные шаги после первого деплоя:**
1. Добавить Netlify домен в Firebase Auth → Authorized domains
2. Задеплоить Firestore правила: `firebase deploy --only firestore:rules`

### GitHub Actions Secrets

Добавь в Settings → Secrets → Actions:

| Secret | Описание |
|--------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API ключ |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth домен |
| `VITE_FIREBASE_PROJECT_ID` | ID проекта |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `NETLIFY_AUTH_TOKEN` | Netlify Personal Access Token |
| `NETLIFY_SITE_ID` | ID сайта в Netlify |

### Мобильное приложение (Capacitor)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init
npm run build
npx cap add android
npx cap sync
npx cap open android  # → Android Studio
```

### Десктоп (Electron)

```bash
npm install electron electron-builder --save-dev
# Добавь electron main.js и конфиг в package.json
npm run electron:build
```

---

## Переменные окружения

Скопируй `.env.example` в `.env` и заполни:

```env
# Firebase — берётся из Firebase Console → Project Settings → Your apps
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=lang-platform.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lang-platform
VITE_FIREBASE_STORAGE_BUCKET=lang-platform.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> ⚠️ Никогда не коммить `.env` — он уже в `.gitignore`.

---

## Roadmap

### Фаза 1 ✅ Турецкий (текущая)
- [x] 20 уроков A1 с тремя типами упражнений
- [x] Таймер, жизни, XP, стрики
- [x] Бейджи и достижения
- [x] Пробный тест ТОМЕР A1
- [x] Firebase Auth + Firestore синхронизация
- [x] Деплой на Netlify + CI/CD

### Фаза 1.5 — Расширение турецкого
- [ ] 20 уроков A2 (глаголы, прошедшее время, бытовые темы)
- [ ] 20 уроков B1 (сложные конструкции, деловой язык)
- [ ] 20 уроков B2 (подготовка к ТОМЕР)
- [ ] Пробные тесты A2, B1, полный ТОМЕР
- [ ] Аудио произношения (Web Speech API / TTS)
- [ ] Восстановление жизней (таймер 4ч)
- [ ] Push-уведомления для стрика

### Фаза 2 — Китайский и Корейский
- [ ] HSK 1–6 (китайский) — иероглифы, пиньинь
- [ ] TOPIK I/II (корейский) — хангыль, грамматика

### Фаза 3 — Остальные языки
- [ ] Арабский — арабское письмо, диалекты
- [ ] Испанский (DELE), Итальянский (CILS), Японский (JLPT)

### Долгосрочно
- [ ] Android / iOS приложение (Capacitor)
- [ ] Windows / macOS приложение (Electron)
- [ ] Таблица лидеров (Firestore)
- [ ] Социальные функции — учись с другом

---

## Лицензия

MIT — используй свободно для образовательных проектов.

---

<div align="center">
  Сделано с ❤️ для изучения языков
</div>
