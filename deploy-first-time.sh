#!/bin/bash
# Скрипт первого деплоя lang-platform
# Запускай из корня проекта: bash deploy-first-time.sh

set -e

echo ""
echo "🚀 Lang Platform — первый деплой"
echo "================================="
echo ""

# 1. Проверка .env
if [ ! -f .env ]; then
  echo "❌ Файл .env не найден!"
  echo "   Выполни: cp .env.example .env"
  echo "   Затем заполни Firebase ключи в .env"
  exit 1
fi
echo "✅ .env найден"

# 2. Проверка node_modules
if [ ! -d node_modules ]; then
  echo "📦 Устанавливаем зависимости..."
  npm install --legacy-peer-deps
fi
echo "✅ Зависимости установлены"

# 3. Сборка
echo ""
echo "🔨 Собираем проект..."
npm run build
echo "✅ Сборка успешна (папка dist/)"

# 4. Размер
echo ""
echo "📊 Размер сборки:"
du -sh dist/

# 5. Git
echo ""
echo "📁 Инициализируем Git..."
if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "feat: initial lang platform 🚀"
  echo ""
  echo "⚠️  Теперь создай репозиторий на GitHub и выполни:"
  echo "   git remote add origin https://github.com/ВАШ_НИК/lang-platform.git"
  echo "   git push -u origin main"
else
  echo "✅ Git репозиторий уже инициализирован"
  git add .
  git status --short
fi

echo ""
echo "📋 Следующие шаги:"
echo "   1. Залей код на GitHub"
echo "   2. Подключи репозиторий на app.netlify.com"
echo "   3. Добавь переменные окружения в Netlify"
echo "   4. Нажми Deploy!"
echo ""
echo "✨ Удачи с деплоем!"
