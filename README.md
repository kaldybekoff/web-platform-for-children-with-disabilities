# QazEdu Special

**Сайт:** https://web-platform-for-children-with-disabilities-13auzqlf4.vercel.app

Инклюзивная образовательная платформа для глухих и слабослышащих детей с поддержкой видеоуроков, субтитров и жестового языка.

## Технологии

| Компонент | Стек |
|-----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, shadcn/ui |
| Backend | FastAPI, SQLModel, PostgreSQL / SQLite, Alembic |
| Аутентификация | JWT (HS256), bcrypt, email‑верификация, Google OAuth (authlib) |
| Email | SMTP (Gmail App Password) |
| Безопасность | slowapi (rate limiting), CSP/XSS headers, SessionMiddleware |
| AI | Google Gemini API |
| Контейнеризация | Docker + docker-compose |

## Структура проекта

```text
web-platform-for-children-with-disabilities/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                  # Миграции БД
│   └── app/
│       ├── main.py               # FastAPI app, middleware, роуты
│       ├── api/                  # auth, users, courses, lessons, enrollments,
│       │                         # quizzes, progress, admin, teacher, news, community, ai
│       ├── models/               # SQLModel модели (таблицы БД)
│       ├── schemas/              # Pydantic схемы запросов/ответов
│       ├── core/                 # config, security, email, limiter, seed
│       └── db/                   # engine, session
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── api/                  # API клиенты
        ├── contexts/             # Auth, язык, тема
        └── components/           # Страницы и UI компоненты
```

## Запуск локально

### Вариант 1 — Docker (рекомендуется)

```bash
docker-compose up --build
```

- Фронтенд: http://localhost:3000
- Бэкенд: http://localhost:8000
- Swagger: http://localhost:8000/docs

При изменении кода: `docker-compose up --build`
Остановить: `docker-compose down`

### Вариант 2 — Терминал

**Бэкенд:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1      # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

**Фронтенд (отдельный терминал):**
```bash
cd frontend
npm install
npm run dev
```

Фронтенд: http://localhost:5173 (Vite проксирует `/api` на бэкенд)

## Переменные окружения

Создай `backend/.env` на основе `backend/.env.example`:

```env
# Обязательные
SECRET_KEY=сгенерируй-через-secrets.token_urlsafe(32)
DATABASE_URL=sqlite:///./qazedu.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Админ (создаётся при старте если заданы)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@1234
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin

# AI (опционально)
GEMINI_API_KEY=твой-ключ

# Email (Gmail SMTP — App Password)
SMTP_USERNAME=твой@gmail.com
SMTP_PASSWORD=app-password-16-символов
SMTP_FROM_EMAIL=твой@gmail.com

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
```

## Аутентификация

### Регистрация
1. Пользователь заполняет форму → `POST /api/auth/register`
2. Создаётся аккаунт с `is_verified=False`
3. На email отправляется письмо со ссылкой
4. Пользователь нажимает ссылку → `GET /api/auth/verify?token=...`
5. `is_verified=True`, можно войти

### Логин
- `POST /api/auth/login` → возвращает JWT токен (срок 7 дней)
- Токен хранится в `localStorage`, отправляется в заголовке `Authorization: Bearer`

### Сброс пароля
1. `POST /api/auth/forgot-password` → письмо с ссылкой (TTL 1 час)
2. `POST /api/auth/reset-password` → новый пароль

### Google OAuth
- `GET /api/auth/google` → редирект на Google
- После авторизации: `GET /api/auth/google/callback` → JWT токен во фронт

### Роли

| Роль | Возможности |
|------|-------------|
| **student** | Курсы, уроки, квизы, прогресс, сообщество, AI‑чат |
| **teacher** | Создание курсов/уроков/квизов, статистика студентов |
| **admin** | Управление пользователями, курсами, новостями, статистика |

## API Endpoints

### Аутентификация

| Метод | Путь | Описание | Лимит |
|-------|------|----------|-------|
| POST | `/api/auth/register` | Регистрация | 5/мин |
| POST | `/api/auth/login` | Вход, получение JWT | 10/мин |
| GET | `/api/auth/verify` | Подтверждение email | — |
| POST | `/api/auth/resend-verification` | Повторная отправка письма | 3/мин |
| POST | `/api/auth/forgot-password` | Запрос сброса пароля | 3/мин |
| POST | `/api/auth/reset-password` | Установка нового пароля | 5/мин |
| GET | `/api/auth/google` | Google OAuth редирект | — |
| GET | `/api/auth/google/callback` | Google OAuth callback | — |

### Профиль

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/me` | Текущий пользователь |
| PATCH | `/api/me` | Обновление профиля |
| POST | `/api/me/password` | Смена пароля |
| GET | `/api/me/achievements` | Статистика достижений |
| GET | `/api/me/study-friends` | Учебные друзья |

### Курсы

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| GET | `/api/courses` | Список курсов | auth |
| GET | `/api/courses/{id}` | Детали курса | auth |
| POST | `/api/courses` | Создать курс | teacher/admin |
| PATCH | `/api/courses/{id}` | Обновить курс | owner/admin |
| DELETE | `/api/courses/{id}` | Удалить курс | owner/admin |
| POST | `/api/courses/{id}/enroll` | Записаться | student |
| GET | `/api/my-courses` | Мои курсы | auth |

### Уроки

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| GET | `/api/courses/{id}/lessons` | Уроки курса | auth |
| GET | `/api/lessons/{id}` | Детали урока | auth |
| POST | `/api/lessons` | Создать урок | teacher/admin |
| PATCH | `/api/lessons/{id}` | Обновить урок | owner/admin |
| DELETE | `/api/lessons/{id}` | Удалить урок | owner/admin |
| POST | `/api/lessons/{id}/complete` | Отметить завершённым | auth |
| GET | `/api/lessons/{id}/progress` | Прогресс по уроку | auth |
| GET | `/api/courses/{id}/my-progress` | Прогресс по курсу | auth |

### Квизы

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| POST | `/api/lessons/{id}/quiz` | Создать квиз | teacher/admin |
| GET | `/api/lessons/{id}/quiz` | Получить квиз | enrolled |
| PATCH | `/api/quizzes/{id}` | Обновить квиз | owner/admin |
| DELETE | `/api/quizzes/{id}` | Удалить квиз | owner/admin |
| POST | `/api/quizzes/{id}/questions` | Добавить вопрос | teacher/admin |
| PATCH | `/api/questions/{id}` | Обновить вопрос | owner/admin |
| DELETE | `/api/questions/{id}` | Удалить вопрос | owner/admin |
| POST | `/api/questions/{id}/answers` | Добавить ответ | teacher/admin |
| PATCH | `/api/answers/{id}` | Обновить ответ | owner/admin |
| DELETE | `/api/answers/{id}` | Удалить ответ | owner/admin |
| POST | `/api/quizzes/{id}/submit` | Сдать квиз | enrolled |
| GET | `/api/quizzes/{id}/my-attempts` | Мои попытки | auth |

### Прочее

| Путь | Описание | Роль |
|------|----------|------|
| `/api/news` | Новости (CRUD) | auth / admin |
| `/api/community/posts` | Стена успехов | auth |
| `/api/ai/chat` | AI‑помощник | auth |
| `/api/admin/*` | Управление платформой | admin |
| `/api/teacher/*` | Статистика учителя | teacher/admin |
| `/health` | Health check | — |
| `/health/db` | DB connectivity | — |

## База данных

| Таблица | Описание |
|---------|----------|
| `users` | email, bcrypt хэш, роль, is_verified, google_id, токены сброса |
| `courses` | Курсы с уровнем и обложкой |
| `lessons` | Уроки с видео, субтитрами, жестовым языком |
| `enrollments` | Записи студентов на курсы с прогрессом |
| `lesson_progress` | Прогресс по каждому уроку |
| `quizzes` | Квизы с проходным баллом |
| `questions` | Вопросы (ru/kz) |
| `answers` | Варианты ответов (ru/kz) |
| `quiz_attempts` | Попытки прохождения квизов |
| `news` | Новости (ru/kz, медиа) |
| `success_posts` | Посты сообщества |
| `success_post_likes` | Лайки постов |

## Миграции

```bash
alembic upgrade head                              # Применить все
alembic downgrade base                            # Откатить всё
alembic revision --autogenerate -m "описание"    # Создать новую
```
