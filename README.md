# QazEdu Special

**Веб-сайт:** https://qazedu.uk  
**API:** https://api.qazedu.uk  
**Документация API (Swagger):** https://api.qazedu.uk/docs  
**Админ-панель:** https://admin.qazedu.uk

Инклюзивная образовательная платформа для глухих и слабослышащих детей. Платформа обеспечивает доступ к видеоурокам с субтитрами и поддержкой жестового языка, позволяет отслеживать прогресс обучения и взаимодействовать с AI-ассистентом.

---

## Бизнес-логика

Платформа поддерживает три роли пользователей с чёткими границами прав доступа.

### Студент
- Регистрация с подтверждением email, вход через Google OAuth
- Поиск курсов и новостей по ключевым словам
- Запись на курсы и прохождение видеоуроков
- Выполнение тестов с мгновенной проверкой ответов
- Отслеживание прогресса по курсам и урокам
- Просмотр статистики достижений
- Вопросы и ответы прямо под уроком (комментарии)
- AI-ассистент по уроку (быстрые подсказки, резюме, примеры) и общий AI-чат (Google Gemini)
- Публикация и лайки в ленте успехов сообщества

### Преподаватель
- Создание и редактирование курсов, уроков, тестов
- Загрузка обложек курсов через drag-and-drop (Cloudinary) или по URL
- Прикрепление видео, субтитров, отметки поддержки жестового языка
- Ответы на вопросы студентов прямо в блоке комментариев урока
- Просмотр прогресса и статистики квизов студентов

### Администратор
- Отдельная админ-панель (starlette-admin) на собственном сервисе/поддомене
- Управление пользователями: создание (с паролем, аккаунт сразу верифицирован), смена роли, сброс пароля (генерация временного), удаление
- Управление всеми курсами, уроками, тестами платформы
- Новости (двуязычно, русский / казахский): создание, массовая публикация и снятие с публикации
- Просмотр статистики платформы
- Создание учётной записи с ролью `admin` через публичную регистрацию запрещено

### Пользовательский путь
1. Регистрация → подтверждение email (ссылка, TTL 24 ч) → вход
2. Выбор курса → запись → просмотр уроков с видео и субтитрами
3. Прохождение теста → мгновенная проверка ответов → отображение результата
4. Автоматическое обновление прогресса по курсу

---

## Технологии

| Компонент | Стек |
|-----------|------|
| Frontend | React 18.3.1, TypeScript 5.9, Vite 6.3.5, Radix UI, Tailwind CSS, shadcn/ui |
| Backend | FastAPI 0.115.6, SQLModel 0.0.22, Alembic 1.14.0, Uvicorn 0.32.1 |
| База данных | PostgreSQL (Neon) / SQLite (локально) |
| Аутентификация | JWT HS256 (python-jose) в HTTP-only cookie + CSRF-токен, bcrypt, Google OAuth2 (authlib) |
| Админ-панель | starlette-admin (отдельный ASGI-сервис) |
| Email | Resend API (HTTP); SMTP — резервный путь в коде |
| AI | Google Gemini API (google-genai) |
| Загрузка файлов | Cloudinary (unsigned upload, бесплатно 25 GB) — обложки курсов |
| Безопасность | slowapi (rate limiting), SecurityHeadersMiddleware (CSP, HSTS и пр.), CSRF double-submit, SessionMiddleware |
| Контейнеризация | Docker, docker-compose (3 сервиса: backend, admin, frontend) |

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
│       ├── main.py               # FastAPI приложение (публичное API), middleware
│       ├── admin_app.py          # ASGI-вход отдельного сервиса админки
│       ├── api/                  # Роутеры: auth, users, courses, lessons,
│       │                         # enrollments, quizzes, progress,
│       │                         # teacher, news, community, ai, comments
│       ├── admin/                # starlette-admin: views, auth provider
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
| `lesson_comments` | lesson_id, user_id, parent_id (ответы), content |

---

## API Endpoints

### Аутентификация (`/api/auth`)

| Метод | Путь | Описание | Лимит |
|-------|------|----------|-------|
| POST | `/register` | Регистрация (роль `admin` запрещена) | 5/мин |
| POST | `/login` | Вход — устанавливает HTTP-only cookie, возвращает CSRF-токен | 10/мин |
| POST | `/logout` | Выход — удаляет cookie | — |
| GET | `/session` | CSRF-токен + текущий пользователь (читается из cookie; используется после Google OAuth) | — |
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
| POST | `/me/password` | Смена пароля (лимит 5/мин) |
| GET | `/me/achievements` | Статистика достижений |
| GET | `/me/study-friends` | Одногруппники по курсам |

### Курсы (`/api`)

| Метод | Путь | Описание | Роль |
|-------|------|----------|------|
| GET | `/courses?search=&level=` | Список курсов с поиском и фильтром | auth |
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
| GET | `/news?search=` | Опубликованные новости с поиском | auth |
| GET | `/lessons/{id}/comments` | Комментарии к уроку | auth |
| POST | `/lessons/{id}/comments` | Добавить комментарий / ответ (лимит 20/мин) | auth |
| DELETE | `/comments/{id}` | Удалить комментарий (автор или admin) | auth |
| GET/POST/DELETE | `/community/posts` | Лента успехов (POST — лимит 10/мин) | auth |
| POST | `/community/posts/{id}/like` | Лайк / снять лайк | auth |
| POST | `/ai/chat` | AI-ассистент (Gemini) | auth |
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
- Админ-панель: http://localhost:8001/admin

### Админ-панель

Управление данными (пользователи, курсы, уроки, тесты, новости, сообщество)
вынесено в отдельный сервис на [starlette-admin](https://github.com/jowilf/starlette-admin)
— модуль `app.admin`, точка входа `app.admin_app:app`. Это отдельный процесс/контейнер,
который переиспользует те же модели и БД, что и основной API.

Кастомные действия: для пользователей — задание пароля при создании/редактировании
и «Сбросить пароль» (генерация временного пароля); для новостей — массовая
публикация и снятие с публикации. Хэши паролей и токены в админке скрыты.

Запуск вручную:
```bash
cd backend
python -m uvicorn app.admin_app:app --reload --port 8001
```

Вход — по учётным данным пользователя с ролью `admin` (тот же логин/пароль, что
заданы через `ADMIN_EMAIL` / `ADMIN_PASSWORD`). В продакшене это отдельный Render-сервис
(`qazedu-admin`), доступный на поддомене https://admin.qazedu.uk; ему нужны только
`DATABASE_URL` и `SECRET_KEY` — он работает напрямую с БД, а не через API.

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

# Email — Resend API (если не задан, email-верификация отключается)
RESEND_API_KEY=re_xxxxxx
RESEND_FROM_EMAIL=noreply@твой-домен        # адрес на домене, верифицированном в Resend
# (необязательно) резервный SMTP — Render блокирует исходящий 587, годится только локально
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USERNAME=твой@gmail.com
# SMTP_PASSWORD=<16-значный App Password>
# SMTP_FROM_EMAIL=твой@gmail.com

# Google OAuth (опционально). Redirect URI в Google Cloud Console должен быть
# ровно {BACKEND_URL}/api/auth/google/callback
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# AI (опционально)
GEMINI_API_KEY=<ключ из Google AI Studio>
```

Переменные окружения **фронтенда** задаются на Vercel (Settings → Environment Variables):

```env
VITE_API_URL=https://api.qazedu.uk

# Cloudinary (опционально — загрузка обложек курсов)
# Если не заданы, поле загрузки заменяется обычным URL-input
VITE_CLOUDINARY_CLOUD_NAME=твой_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=qazedu_unsigned
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
| Frontend | Vercel (`qazedu`) | https://qazedu.uk |
| Backend | Render (`qazedu`) | https://api.qazedu.uk |
| Админ-панель | Render (`qazedu-admin`) | https://admin.qazedu.uk |
| База данных | Neon PostgreSQL | neon.tech |
| Email | Resend API | resend.com |
| DNS / домен | Cloudflare Registrar | qazedu.uk |

Домен `qazedu.uk` зарегистрирован в Cloudflare; поддомены `api` и `admin` указывают
CNAME-записями на соответствующие Render-сервисы (Proxy: DNS only), корень и `www` —
на Vercel. Push в ветку `main` автоматически запускает деплой всех сервисов.

Переменные окружения в продакшене отличаются от локальных: `SECRET_KEY` — свой
случайный; `BACKEND_URL=https://api.qazedu.uk`; `FRONTEND_URL=https://qazedu.uk`;
`CORS_ORIGINS=https://qazedu.uk,https://www.qazedu.uk,https://admin.qazedu.uk`;
на Vercel — `VITE_API_URL=https://api.qazedu.uk`.
