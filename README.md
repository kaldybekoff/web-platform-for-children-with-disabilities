# QazEdu Special

Инклюзивная образовательная платформа для глухих и слабослышащих детей с поддержкой видеоуроков, субтитров и жестового языка.

## О проекте

QazEdu Special — веб‑платформа дистанционного обучения для детей с нарушениями слуха.  
Система предоставляет структурированные курсы и уроки, интерактивные квизы, отслеживание прогресса, новости платформы, сообщество успехов и AI‑помощника для поддержки обучения.

### Основные возможности

- **Курсы и уроки**: структурированные учебные материалы, уроки с видео (YouTube и другие источники), текстовым контентом и возможностью добавления субтитров/жестового сопровождения.
- **Интерактивные квизы**: тесты по урокам с автоматической проверкой ответов, подсчётом баллов и сохранением попыток.
- **Система прогресса**: отслеживание прохождения уроков и курсов, статистика по завершённым урокам и курсам.
- **Сообщество**: “стена успехов” (success posts) с лайками, а также список учебных друзей на основе общих курсов.
- **Новости платформы**: лента новостей с медиаконтентом (YouTube‑видео или изображения).
- **AI‑помощник**: интеграция с Google Gemini для ответов на вопросы и помощи в обучении.
- **Роли и доступы**: раздельный функционал для студента, учителя и администратора.
- **Двуязычный интерфейс**: русский и казахский языки.
- **Светлая/тёмная тема**: адаптация интерфейса под предпочтения пользователя.

## Технологии

| Компонент | Стек |
|-----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, shadcn/ui |
| Backend | FastAPI, SQLModel, PostgreSQL / SQLite, Alembic |
| Аутентификация | JWT (JSON Web Tokens), хэширование паролей (bcrypt) |
| AI | Google Gemini API (`google-genai`) |

## Структура проекта

```text
web-platform-for-children-with-disabilities/
├── frontend/                  # React + Vite (SPA)
│   ├── src/
│   │   ├── api/               # API‑клиенты (auth, me, courses, lessons, quizzes, progress, news, admin, teacher, community, ai)
│   │   ├── components/        # Страницы и крупные UI‑блоки (AuthPage, Dashboard, Courses, Lessons, News, Community, AIChat и др.)
│   │   ├── components/ui/     # Библиотека UI‑компонентов (shadcn/ui)
│   │   └── contexts/          # Контексты: аутентификация, язык, тема
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                   # FastAPI
    ├── app/
    │   ├── api/               # Роуты: auth, users, courses, lessons, enrollments, quizzes, progress, admin, teacher, news, community, ai
    │   ├── models/            # Модели БД (User, Course, Lesson, Enrollment, Quiz, Question, Answer, QuizAttempt, LessonProgress, News, SuccessPost, SuccessPostLike)
    │   ├── schemas/           # Pydantic‑схемы запросов и ответов
    │   ├── core/              # Настройки, конфигурация, безопасность, seed‑логика
    │   ├── db/                # Подключение к БД и сессия (`engine`, `get_session`, `create_db_and_tables`)
    │   └── main.py            # Точка входа FastAPI, подключение всех роутов и CORS
    ├── alembic/               # Миграции Alembic (структура таблиц для PostgreSQL)
    └── requirements.txt
```

## Запуск проекта

### 1. Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv .venv

# Активировать (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Активировать (macOS/Linux)
source .venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
```

Создайте файл `.env` в папке `backend/` (на основе `backend/.env.example`):

```env
# База данных (PostgreSQL или SQLite)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT (ОБЯЗАТЕЛЬНО задать SECRET_KEY)
# Сгенерировать можно, например:
# python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-secure-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS (список разрешённых origin, через запятую)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Админ (опционально, для автоматического создания admin‑пользователя при старте)
# Администратор будет создан ТОЛЬКО если заданы все поля ниже.
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=StrongPassword123!
# ADMIN_FIRST_NAME=System
# ADMIN_LAST_NAME=Admin

# AI (опционально, для AI‑помощника)
# GEMINI_API_KEY=your-gemini-api-key
```

Запуск backend‑сервера:

```bash
# Вариант 1: PostgreSQL (рекомендуется для продакшена)
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000

# Вариант 2: SQLite для локальной разработки
# Например: DATABASE_URL=sqlite:///./qazedu.db
# При SQLite все таблицы создаются автоматически при старте приложения
# через create_db_and_tables(), без Alembic‑миграций.
python -m uvicorn app.main:app --reload --port 8000
```

Backend: `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev‑сервер
npm run dev
```

Frontend: `http://localhost:5173`

> Vite проксирует запросы `/api` на backend (см. `vite.config.ts`).

## Аутентификация и роли

- Аутентификация реализована через JWT (Bearer‑токен в заголовке `Authorization`).  
- Пользователь логинится через `/api/auth/login` и получает токен и информацию о себе.  
- В приложении используются три роли: **student**, **teacher**, **admin**.

### Ученик (student)

- Регистрация и вход в систему.
- Просмотр каталога курсов и запись на курсы.
- Просмотр уроков с видео и текстовым контентом.
- Прохождение квизов по урокам.
- Отслеживание прогресса по урокам и курсам в профиле.
- Публикация постов в “стене успехов” и лайки чужих постов.
- Просмотр учебных друзей (другие студенты с общими курсами).
- Общение с AI‑помощником (чат).
- Просмотр новостей платформы.
- Редактирование профиля и смена пароля.

### Учитель (teacher)

- Создание и редактирование собственных курсов.
- Добавление и редактирование уроков в своих курсах.
- Создание и настройка квизов (вопросы, ответы, порядок, проходной балл).
- Просмотр статистики по своим студентам (прогресс по курсам, результаты квизов).
- Участие в сообществе (стена успехов).
- Редактирование своего профиля и смена пароля.

### Администратор (admin)

- Просмотр агрегированной статистики платформы (количество пользователей, курсов, уроков, записей и т.д.).
- Управление пользователями (список, просмотр, удаление).
- Изменение ролей пользователей через специальный endpoint.
- Управление всеми курсами (через административные компоненты фронтенда).
- Создание, редактирование и управление новостями платформы.

## Основные API endpoints

Ниже приведён обзор основных маршрутов. Все пути указаны с учётом префикса `/api`, который добавляется в `app.main`.

### Аутентификация (`app/api/auth.py`)

| Метод | Endpoint              | Описание                              |
|-------|-----------------------|---------------------------------------|
| POST  | `/api/auth/register`  | Регистрация нового пользователя       |
| POST  | `/api/auth/login`     | Вход, выдача JWT и данных пользователя |

### Профиль и личный кабинет (`app/api/users.py`, `app/api/auth.py`)

| Метод | Endpoint               | Описание                               |
|-------|------------------------|----------------------------------------|
| GET   | `/api/me`              | Текущий пользователь                   |
| PATCH | `/api/me`              | Обновление профиля (имя, фамилия, email) |
| POST  | `/api/me/password`     | Смена пароля                           |
| GET   | `/api/me/achievements` | Статистика достижений                  |
| GET   | `/api/me/study-friends`| Список учебных друзей                  |

### Курсы (`app/api/courses.py`, `app/api/enrollments.py`)

| Метод | Endpoint                    | Описание                                        |
|-------|-----------------------------|-------------------------------------------------|
| GET   | `/api/courses`             | Список доступных курсов                         |
| GET   | `/api/courses/{course_id}` | Детали курса                                   |
| POST  | `/api/courses`             | Создать курс (teacher/admin)                    |
| PATCH | `/api/courses/{course_id}` | Обновить курс (teacher‑владелец или admin)      |
| DELETE| `/api/courses/{course_id}` | Удалить курс (teacher‑владелец или admin)       |
| POST  | `/api/courses/{course_id}/enroll` | Записаться на курс (student)            |
| GET   | `/api/my-courses`         | Список курсов, на которые записан студент       |

### Уроки (`app/api/lessons.py`)

| Метод | Endpoint                           | Описание                                             |
|-------|------------------------------------|------------------------------------------------------|
| GET   | `/api/courses/{course_id}/lessons`| Список уроков курса                                  |
| GET   | `/api/lessons/{lesson_id}`        | Получить урок (доступ проверяется по записи на курс) |
| POST  | `/api/lessons`                    | Создать урок (teacher/admin)                         |
| PATCH | `/api/lessons/{lesson_id}`        | Обновить урок (teacher‑владелец или admin)           |
| DELETE| `/api/lessons/{lesson_id}`        | Удалить урок (teacher‑владелец или admin)            |

### Прогресс (`app/api/progress.py`)

| Метод | Endpoint                             | Описание                                      |
|-------|--------------------------------------|-----------------------------------------------|
| POST  | `/api/lessons/{lesson_id}/complete` | Отметить урок завершённым                     |
| GET   | `/api/lessons/{lesson_id}/progress` | Прогресс студента по конкретному уроку        |
| GET   | `/api/courses/{course_id}/my-progress` | Прогресс студента по курсу                 |

### Квизы (`app/api/quizzes.py`)

| Метод | Endpoint                                   | Описание                                        |
|-------|--------------------------------------------|-------------------------------------------------|
| POST  | `/api/lessons/{lesson_id}/quiz`           | Создать или обновить квиз для урока (teacher/admin) |
| GET   | `/api/lessons/{lesson_id}/quiz`           | Получить квиз для урока                         |
| PATCH | `/api/quizzes/{quiz_id}`                  | Обновить параметры квиза                        |
| DELETE| `/api/quizzes/{quiz_id}`                  | Удалить квиз                                    |
| POST  | `/api/quizzes/{quiz_id}/questions`        | Добавить вопрос                                 |
| PATCH | `/api/questions/{question_id}`            | Обновить вопрос                                 |
| DELETE| `/api/questions/{question_id}`            | Удалить вопрос                                  |
| POST  | `/api/questions/{question_id}/answers`    | Добавить ответ                                  |
| PATCH | `/api/answers/{answer_id}`                | Обновить ответ                                  |
| DELETE| `/api/answers/{answer_id}`                | Удалить ответ                                   |
| POST  | `/api/quizzes/{quiz_id}/submit`           | Отправить ответы студента, получить результат   |
| GET   | `/api/quizzes/{quiz_id}/my-attempts`      | Список попыток студента по квизу                |

### Новости (`app/api/news.py`)

Новости поддерживают медиаконтент через универсальные поля `media_url` и `media_type`, а также legacy‑поля `video_url` и `image_url` для обратной совместимости.

| Метод | Endpoint                 | Описание                                              |
|-------|--------------------------|-------------------------------------------------------|
| GET   | `/api/news`              | Список опубликованных новостей (для авторизованных)  |
| GET   | `/api/news/{news_id}`    | Получить новость по ID                               |
| GET   | `/api/news/admin/all`    | Все новости (включая неопубликованные, только admin) |
| POST  | `/api/news`              | Создать новость (admin)                              |
| PATCH | `/api/news/{news_id}`    | Обновить новость (admin)                             |
| DELETE| `/api/news/{news_id}`    | Удалить новость (admin)                              |

### Сообщество (`app/api/community.py`)

| Метод | Endpoint                           | Описание                             |
|-------|------------------------------------|--------------------------------------|
| GET   | `/api/community/posts`            | Список постов успехов                |
| POST  | `/api/community/posts`            | Создать пост                         |
| POST  | `/api/community/posts/{post_id}/like` | Лайк/анлайк поста                |
| DELETE| `/api/community/posts/{post_id}`  | Удалить пост (автор или admin)      |

### AI‑помощник (`app/api/ai.py`)

| Метод | Endpoint          | Описание                                  |
|-------|-------------------|-------------------------------------------|
| POST  | `/api/ai/chat`    | Отправить сообщение и получить ответ AI   |

### Админ (`app/api/admin.py`)

| Метод | Endpoint                         | Описание                                   |
|-------|----------------------------------|--------------------------------------------|
| GET   | `/api/admin/stats`              | Общая статистика по платформе             |
| GET   | `/api/admin/users`              | Список пользователей (с пагинацией/фильтрами) |
| GET   | `/api/admin/users/{user_id}`    | Получить пользователя                     |
| PATCH | `/api/admin/users/{user_id}/role` | Изменить роль пользователя               |
| DELETE| `/api/admin/users/{user_id}`    | Удалить пользователя                      |

### Учитель (`app/api/teacher.py`)

| Метод | Endpoint                 | Описание                                           |
|-------|--------------------------|----------------------------------------------------|
| GET   | `/api/teacher/stats`    | Статистика учителя по его курсам и студентам      |
| GET   | `/api/teacher/students` | Студенты с прогрессом и статистикой по курсам/квизам |

## База данных

Основные таблицы (по моделям SQLModel и миграциям Alembic):

| Таблица              | Описание |
|----------------------|----------|
| `users`              | Пользователи (email, захэшированный пароль, имя, фамилия, роль) |
| `courses`            | Курсы (название, описание, уровень, учитель, обложка `image_url`) |
| `lessons`            | Уроки (название, контент, `video_url`, `subtitle_url`, признак жестового перевода, длительность, демо‑флаг) |
| `enrollments`        | Записи на курсы (студент, курс, текущий прогресс) |
| `lesson_progress`    | Прогресс по урокам (студент, урок, флаг завершения, время просмотра) |
| `quizzes`            | Квизы для уроков (урок, название, проходной балл) |
| `questions`          | Вопросы квиза (тексты ru/kz, порядок) |
| `answers`            | Варианты ответов (тексты ru/kz, флаг правильности, порядок) |
| `quiz_attempts`      | Попытки прохождения квизов (студент, квиз, балл, факт прохождения, время) |
| `news`               | Новости (заголовки и контент ru/kz, `media_url`, `media_type`, legacy‑поля `video_url`/`image_url`, статус публикации, автор, даты) |
| `success_posts`      | Посты успехов сообщества (автор, текст, количество лайков) |
| `success_post_likes` | Лайки постов (связь пользователь–пост) |

При использовании PostgreSQL структура поддерживается и изменяется через Alembic‑миграции. При использовании SQLite для локальной разработки таблицы создаются по текущим моделям (`SQLModel.metadata`) при старте приложения.

## Миграции Alembic

В продакшене (PostgreSQL) рекомендуется всегда использовать Alembic:

```bash
# Применить все миграции
alembic upgrade head

# Откатить все миграции до базы
alembic downgrade base

# Создать новую миграцию на основе изменений моделей
alembic revision --autogenerate -m "описание"
```

При работе с SQLite в режиме локальной разработки можно не запускать Alembic: все таблицы будут созданы автоматически при старте (`create_db_and_tables()`).

## Лицензия и UI‑компоненты

Фронтенд использует компоненты [shadcn/ui](https://ui.shadcn.com/) (MIT License) и Radix UI в качестве основы дизайн‑системы. Остальная часть проекта предназначена для демонстрации и учебных целей.
