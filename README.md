# QazEdu Special

**Веб-сайт:** https://qazedu.vercel.app  
**API:** https://qazedu.onrender.com  
**Документация API (Swagger):** https://qazedu.onrender.com/docs

Инклюзивная образовательная платформа для глухих и слабослышащих детей. Платформа обеспечивает доступ к видеоурокам с субтитрами и поддержкой жестового языка, позволяет отслеживать прогресс обучения и взаимодействовать с AI-ассистентом.

---

## Бизнес-логика

Платформа поддерживает три роли пользователей с чёткими границами прав доступа.

### Студент
- Регистрация с подтверждением email, вход через Google OAuth
- Запись на курсы и прохождение видеоуроков
- Выполнение тестов с мгновенной проверкой ответов
- Отслеживание прогресса по курсам и урокам
- Просмотр статистики достижений
- Публикация и лайки в ленте успехов сообщества
- Диалог с AI-ассистентом (Google Gemini)

### Преподаватель
- Создание и редактирование курсов, уроков, тестов
- Прикрепление видео, субтитров, отметки поддержки жестового языка
- Просмотр прогресса и статистики квизов студентов

### Администратор
- Управление пользователями: просмотр, смена роли, удаление
- Управление всеми курсами платформы
- Публикация новостей (двуязычно: русский / казахский)
- Просмотр статистики платформы

### Пользовательский путь
1. Регистрация → подтверждение email (ссылка, TTL 24 ч) → вход
2. Выбор курса → запись → просмотр уроков с видео и субтитрами
3. Прохождение теста → мгновенная проверка ответов → отображение результата
4. Автоматическое обновление прогресса по курсу

---

## Технологии

| Компонент | Стек |
|-----------|------|
| Frontend | React 18.3.1, TypeScript, Vite 6.3.5, Radix UI, Tailwind CSS, shadcn/ui |
| Backend | FastAPI 0.115.6, SQLModel 0.0.22, Alembic 1.14.0, Uvicorn 0.32.1 |
| База данных | PostgreSQL (Neon) / SQLite (локально) |
| Аутентификация | JWT HS256 (python-jose), bcrypt, Google OAuth2 (authlib) |
| Email | Resend API (production), SMTP Gmail (локально) |
| AI | Google Gemini API (google-genai) |
| Безопасность | slowapi (rate limiting), SecurityHeadersMiddleware, SessionMiddleware |
| Контейнеризация | Docker, docker-compose |

---

## Структура проекта

```
web-platform-for-children-with-disabilities/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/                  # Миграции БД
│   └── app/
│       ├── main.py               # FastAPI приложение, middleware
│       ├── api/                  # Роутеры: auth, users, courses, lessons,
│       │                         # enrollments, quizzes, progress, admin,
│       │                         # teacher, news, community, ai
│       ├── models/               # SQLModel модели (таблицы БД)
│       ├── schemas/              # Pydantic схемы запросов и ответов
│       ├── core/                 # config, security, email, limiter, seed
│       └── db/                   # engine, session
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vercel.json
    └── src/
        ├── api/                  # API-клиенты
        ├── contexts/             # Контексты: Auth, язык, тема
        └── components/           # Страницы и UI-компоненты
```

---

## База данных

| Таблица | Описание |
|---------|----------|
| `users` | email, bcrypt-хэш пароля, роль, статус верификации, google_id, токены |
| `courses` | название, описание, уровень, обложка, teacher_id |
| `lessons` | title, content, video_url, subtitle_url, has_sign_language, duration_seconds, is_demo, порядок |
| `enrollments` | student_id, course_id, прогресс (0–100%) |
| `lesson_progress` | student_id, lesson_id, completed, watch_time_seconds |
| `quizzes` | lesson_id (уникальный), passing_score |
| `questions` | quiz_id, text_ru, text_kz, порядок |
| `answers` | question_id, text_ru, text_kz, is_correct, порядок |
| `quiz_attempts` | quiz_id, student_id, score (%), passed |
| `news` | title/content на ru/kz, media, is_published, author_id |
| `success_posts` | user_id, content, likes_count |
| `success_post_likes` | post_id, user_id (уникальная пара — защита от дублей) |

---

## API Endpoints

### Аутентификация (`/api/auth`)

| Метод | Путь | Описание | Лимит |
|-------|------|----------|-------|
| POST | `/register` | Регистрация | 5/мин |
| POST | `/login` | Вход, получение JWT | 10/мин |
| GET | `/verify?token=` | Подтверждение email | — |
| POST | `/resend-verification` | Повторная отправка письма | 3/мин |
| POST | `/forgot-password` | Запрос сброса пароля | 3/мин |
| POST | `/reset-password` | Установка нового пароля | 5/мин |
| GET | `/google` | Инициализация Google OAuth | — |
| GET | `/google/callback` | Callback Google OAuth | — |

### Профиль (`/api`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/me` | Данные текущего пользователя |
| PATCH | `/me` | Обновление имени / email |
| POST | `/me/password` | Смена пароля |
| GET | `/me/achievements` | Статистика достижений |
| GET | `/me/study-friends` | Одногруппники по курсам |

### Курсы (`/api`)

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| GET | `/courses` | Список курсов | auth |
| GET | `/courses/{id}` | Детали курса | auth |
| POST | `/courses` | Создать курс | teacher / admin |
| PATCH | `/courses/{id}` | Обновить курс | владелец / admin |
| DELETE | `/courses/{id}` | Удалить курс | владелец / admin |
| POST | `/courses/{id}/enroll` | Записаться на курс | student |
| GET | `/my-courses` | Мои записи | auth |

### Уроки (`/api`)

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| GET | `/courses/{id}/lessons` | Уроки курса | auth |
| GET | `/lessons/{id}` | Детали урока | auth |
| POST | `/lessons` | Создать урок | teacher / admin |
| PATCH | `/lessons/{id}` | Обновить урок | владелец / admin |
| DELETE | `/lessons/{id}` | Удалить урок | владелец / admin |

### Прогресс (`/api`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/lessons/{id}/complete` | Отметить урок завершённым |
| GET | `/lessons/{id}/progress` | Прогресс по уроку |
| GET | `/courses/{id}/my-progress` | Прогресс по курсу |

### Тесты (`/api`)

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| POST | `/lessons/{id}/quiz` | Создать тест | teacher / admin |
| GET | `/lessons/{id}/quiz` | Получить тест | enrolled |
| PATCH | `/quizzes/{id}` | Обновить тест | владелец / admin |
| DELETE | `/quizzes/{id}` | Удалить тест | владелец / admin |
| POST | `/quizzes/{id}/questions` | Добавить вопрос | teacher / admin |
| PATCH | `/questions/{id}` | Обновить вопрос | владелец / admin |
| DELETE | `/questions/{id}` | Удалить вопрос | владелец / admin |
| POST | `/questions/{id}/answers` | Добавить вариант ответа | teacher / admin |
| PATCH | `/answers/{id}` | Обновить ответ | владелец / admin |
| DELETE | `/answers/{id}` | Удалить ответ | владелец / admin |
| POST | `/questions/{id}/check` | Проверить одиночный ответ | enrolled |
| POST | `/quizzes/{id}/submit` | Сдать тест | enrolled |
| GET | `/quizzes/{id}/my-attempts` | Мои попытки | auth |

### Прочее

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| GET/POST/PATCH/DELETE | `/news` | Новости | auth / admin |
| GET/POST/DELETE | `/community/posts` | Лента успехов | auth |
| POST | `/community/posts/{id}/like` | Лайк / снять лайк | auth |
| POST | `/ai/chat` | AI-ассистент (Gemini) | auth |
| GET/PATCH/DELETE | `/admin/users` | Управление пользователями | admin |
| GET | `/admin/stats` | Статистика платформы | admin |
| GET | `/teacher/stats` | Статистика преподавателя | teacher / admin |
| GET | `/teacher/students` | Студенты преподавателя | teacher / admin |
| GET | `/health` | Статус сервера | — |
| GET | `/health/db` | Статус БД | — |

---

## Запуск локально

### Docker (рекомендуется)

```bash
docker-compose up --build
```

- Фронтенд: http://localhost:3000
- Бэкенд: http://localhost:8000
- Swagger: http://localhost:8000/docs

### Вручную

**Бэкенд:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1        # Windows
# source .venv/bin/activate       # macOS / Linux
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

Фронтенд: http://localhost:5173 — Vite проксирует `/api` на бэкенд.

---

## Переменные окружения

Создай `backend/.env` на основе `backend/.env.example`:

```env
# Обязательные
SECRET_KEY=<сгенерировать: openssl rand -hex 32>
DATABASE_URL=sqlite:///./qazedu.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Администратор (создаётся при старте)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@1234
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Admin

# Email — локально (Gmail SMTP)
SMTP_USERNAME=твой@gmail.com
SMTP_PASSWORD=<16-значный App Password>
SMTP_FROM_EMAIL=твой@gmail.com

# Email — production (Resend API)
RESEND_API_KEY=re_xxxxxx

# Google OAuth (опционально)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# AI (опционально)
GEMINI_API_KEY=<ключ из Google AI Studio>
```

---

## Миграции БД

```bash
alembic upgrade head                           # Применить все миграции
alembic downgrade base                         # Откатить всё
alembic revision --autogenerate -m "описание"  # Создать новую миграцию
```

---

## Деплой (production)

| Компонент | Сервис | URL |
|-----------|--------|-----|
| Frontend | Vercel | https://qazedu.vercel.app |
| Backend | Render | https://qazedu.onrender.com |
| База данных | Neon PostgreSQL | neon.tech |
| Email | Resend API | resend.com |

Push в ветку `main` автоматически запускает деплой на обоих сервисах.
