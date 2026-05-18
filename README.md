# ◈ Fintrak — Finance Tracker

Полноценное приложение для отслеживания личных финансов.  
**Stack:** Python FastAPI · PostgreSQL · React · Recharts · Docker

---

## Структура проекта

```
finance-tracker/
├── backend/
│   ├── main.py          # FastAPI приложение, все роуты
│   ├── models.py        # SQLAlchemy модели
│   ├── schemas.py       # Pydantic схемы
│   ├── database.py      # Подключение к БД
│   ├── seed.py          # Начальные данные
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Главная с графиками
│   │   │   ├── Transactions.jsx  # Таблица с фильтрами
│   │   │   ├── Analytics.jsx     # Детальная аналитика
│   │   │   └── Categories.jsx    # Управление категориями
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Card.jsx
│   │   │   └── TransactionModal.jsx
│   │   ├── api.js          # API клиент
│   │   ├── ToastContext.jsx # Уведомления
│   │   └── App.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
└── docker-compose.yml
```

---

## Быстрый старт через Docker (рекомендуется)

### Требования
- Docker + Docker Compose

### Запуск

```bash
# Клонируй проект
cd finance-tracker

# Запусти всё одной командой
docker compose up --build

# БД заполнится демо-данными автоматически
```

Открой браузер: **http://localhost:3000**  
API доступно по: **http://localhost:8000**  
Swagger UI: **http://localhost:8000/docs**

---

## Ручной запуск (без Docker)

### 1. PostgreSQL

Создай базу данных:

```sql
CREATE DATABASE finance_tracker;
```

### 2. Backend

```bash
cd backend

# Создай виртуальное окружение
python -m venv venv
source venv/bin/activate      # Linux/Mac
# venv\Scripts\activate       # Windows

# Установи зависимости
pip install -r requirements.txt

# Создай файл .env
cp .env.example .env
# Отредактируй DATABASE_URL если нужно

# Заполни БД демо-данными
python seed.py

# Запусти сервер
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend

# Установи зависимости
npm install

# Создай .env
cp .env.example .env

# Запусти dev-сервер
npm run dev
```

Открой: **http://localhost:3000**

---

## API Endpoints

| Method | Path | Описание |
|--------|------|----------|
| GET    | `/categories` | Список категорий |
| POST   | `/categories` | Создать категорию |
| PUT    | `/categories/{id}` | Обновить категорию |
| DELETE | `/categories/{id}` | Удалить категорию |
| GET    | `/transactions` | Список транзакций (с фильтрами) |
| POST   | `/transactions` | Создать транзакцию |
| PUT    | `/transactions/{id}` | Обновить транзакцию |
| DELETE | `/transactions/{id}` | Удалить транзакцию |
| GET    | `/analytics/summary` | Сводка доходов/расходов |
| GET    | `/analytics/by-category` | Разбивка по категориям |
| GET    | `/analytics/monthly` | Помесячная статистика |
| GET    | `/export/csv` | Экспорт в CSV |

### Параметры фильтрации `/transactions`

| Параметр | Тип | Описание |
|----------|-----|----------|
| `skip` | int | Смещение (пагинация) |
| `limit` | int | Лимит записей |
| `type` | string | `income` или `expense` |
| `category_id` | int | ID категории |
| `date_from` | date | Начало периода (YYYY-MM-DD) |
| `date_to` | date | Конец периода |
| `search` | string | Поиск по описанию |

---

## База данных

### Таблица `categories`

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Primary key |
| name | VARCHAR(100) | Уникальное название |
| color | VARCHAR(20) | HEX цвет (#rrggbb) |
| icon | VARCHAR(50) | Emoji иконка |

### Таблица `transactions`

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER | Primary key |
| amount | FLOAT | Сумма (> 0) |
| type | ENUM | `income` / `expense` |
| date | DATE | Дата транзакции |
| description | TEXT | Описание (nullable) |
| category_id | INTEGER | FK → categories.id |

---

## Функционал

- **Dashboard** — сводка по году, income/expense area chart, pie по категориям, последние транзакции
- **Transactions** — таблица с пагинацией, фильтры по типу / категории / дате / поиску, CRUD, экспорт CSV
- **Analytics** — годовой/месячный выбор, bar chart, line chart баланса, pie + прогресс-бары по категориям
- **Categories** — создание с emoji + цветом, редактирование, удаление

---

## Расширение проекта

Идеи для дальнейшего развития:
- **JWT авторизация** — несколько пользователей (`fastapi-users` или `python-jose`)
- **Бюджеты** — лимиты на категорию в месяц с уведомлениями
- **Повторяющиеся транзакции** — ежемесячные платежи
- **Мобильное приложение** — API уже готов, подключи React Native
- **Экспорт PDF** — используй `reportlab` или `weasyprint` на бэкенде
- **Telegram бот** — добавляй транзакции через бота

---

*Fintrak v1.0.0 · FastAPI + React + PostgreSQL*
