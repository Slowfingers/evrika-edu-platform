# EvrikaEdu Platform

Платформа для учителей с каталогом методических приёмов и интерактивными инструментами для урока.

## Возможности

- 📚 **Каталог приёмов** — 32+ методических карточки с фильтрами
- 🎯 **Конструктор урока** — создание плана урока из приёмов
- ⏱️ **Таймер урока** — управление этапами урока
- 🎯 **Мишень рефлексии** — сбор обратной связи на Smart-доске
- 🔊 **Шумометр** — контроль уровня шума в классе
- 🪑 **Управление классом** — рассадка учеников

## Технологии

**Backend:**
- Node.js + Express
- SQLite (локальная база данных)

**Frontend:**
- SvelteKit
- TailwindCSS
- PWA (Progressive Web App)

## Запуск

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (в другом терминале)
cd frontend
npm install
npm run dev
```

## Структура

```
evrika-platform/
├── backend/
│   ├── src/
│   │   ├── routes/     # API маршруты
│   │   └── services/   # Бизнес-логика
│   └── evrika.db       # SQLite база данных
├── frontend/
│   ├── src/
│   │   ├── lib/        # Компоненты
│   │   └── routes/     # Страницы
│   └── static/         # Статические файлы
└── README.md
```
