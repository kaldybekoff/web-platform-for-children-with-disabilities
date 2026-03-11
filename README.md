# QazEdu Special

Образовательная платформа для глухих и слабослышащих детей с поддержкой жестового языка.

## О проекте

QazEdu Special — это веб-платформа дистанционного обучения, разработанная специально для детей с нарушениями слуха. Платформа предоставляет:

- Видеоуроки с субтитрами и переводом на жестовый язык
- Интерактивные задания и тесты
- Систему курсов с отслеживанием прогресса
- Поддержку трёх ролей: ученик, учитель, администратор
- Двуязычный интерфейс (русский и казахский)
- Тёмную и светлую тему оформления

## Технологии

| Компонент | Стек |
|-----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend | FastAPI, SQLModel, PostgreSQL, Alembic |
| Аутентификация | JWT (JSON Web Tokens) |

## Структура проекта

```
edu-platform/
├── frontend/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── api/       # API-клиент
│   │   ├── components/# UI-компоненты
│   │   └── contexts/  # React-контексты (Auth, Theme, Language)
│   ├── package.json
│   └── vite.config.ts
│
└── backend/           # Backend (FastAPI)
    ├── app/
    │   ├── api/       # Роуты (auth, courses, lessons, quizzes, admin, teacher)
    │   ├── models/    # Модели БД (User, Course, Lesson, Quiz, Enrollment)
    │   ├── schemas/   # Pydantic-схемы
    │   └── core/      # Безопасность (JWT, хеширование)
    ├── alembic/       # Миграции базы данных
    └── requirements.txt
```

## Запуск проекта

### 1. Backend

```bash
cd backend

# Создать виртуальное окружение
python -m venv .venv

# Активировать (Windows)
.venv\Scripts\activate

# Активировать (macOS/Linux)
source .venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
```

Создайте файл `.env` в папке `backend/` со следующими переменными:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:3000
```

Запустите миграции и сервер:

```bash
# Применить миграции
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload --port 8000
```

Backend будет доступен по адресу: http://localhost:8000  
Документация API (Swagger): http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Frontend будет доступен по адресу: http://localhost:3000

> Vite автоматически проксирует запросы `/api` на backend (http://localhost:8000).

## Функционал по ролям

### Ученик (student)
- Просмотр каталога курсов
- Запись на курсы
- Просмотр уроков с видео и субтитрами
- Отслеживание прогресса в профиле

### Учитель (teacher)
- Создание и редактирование своих курсов
- Добавление уроков к курсам
- Просмотр статистики по студентам

### Администратор (admin)
- Управление всеми пользователями
- Управление всеми курсами
- Полная статистика платформы

## API Endpoints

### Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход (получение токена) |

### Пользователи
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/me` | Текущий пользователь |
| PATCH | `/api/me` | Обновление профиля |

### Курсы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/courses` | Список курсов |
| POST | `/api/courses` | Создать курс (учитель/админ) |
| GET | `/api/courses/{id}` | Получить курс |
| PATCH | `/api/courses/{id}` | Обновить курс (владелец/админ) |
| DELETE | `/api/courses/{id}` | Удалить курс (владелец/админ) |
| POST | `/api/courses/{id}/enroll` | Записаться на курс |
| GET | `/api/my-courses` | Мои курсы |

### Уроки
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/courses/{id}/lessons` | Уроки курса |
| GET | `/api/lessons/{id}` | Получить урок |
| POST | `/api/lessons` | Создать урок (учитель/админ) |
| PATCH | `/api/lessons/{id}` | Обновить урок |
| DELETE | `/api/lessons/{id}` | Удалить урок |

### Прогресс
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/lessons/{id}/complete` | Отметить урок завершённым |
| GET | `/api/lessons/{id}/progress` | Прогресс по уроку |
| GET | `/api/courses/{id}/my-progress` | Прогресс по курсу |

### Квизы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/lessons/{id}/quiz` | Создать квиз |
| GET | `/api/lessons/{id}/quiz` | Получить квиз |
| PATCH | `/api/quizzes/{id}` | Обновить квиз |
| DELETE | `/api/quizzes/{id}` | Удалить квиз |
| POST | `/api/quizzes/{id}/questions` | Добавить вопрос |
| PATCH | `/api/questions/{id}` | Обновить вопрос |
| DELETE | `/api/questions/{id}` | Удалить вопрос |
| POST | `/api/questions/{id}/answers` | Добавить ответ |
| PATCH | `/api/answers/{id}` | Обновить ответ |
| DELETE | `/api/answers/{id}` | Удалить ответ |
| POST | `/api/quizzes/{id}/submit` | Отправить ответы |
| GET | `/api/quizzes/{id}/my-attempts` | Мои попытки |

### Админ
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/admin/stats` | Статистика платформы |
| GET | `/api/admin/users` | Список пользователей |
| GET | `/api/admin/users/{id}` | Получить пользователя |
| PATCH | `/api/admin/users/{id}` | Обновить пользователя |
| PATCH | `/api/admin/users/{id}/role` | Изменить роль |
| DELETE | `/api/admin/users/{id}` | Удалить пользователя |

### Учитель
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/teacher/stats` | Статистика учителя |
| GET | `/api/teacher/students` | Список студентов |

## База данных

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи (email, пароль, имя, роль) |
| `courses` | Курсы (название, описание, уровень, учитель) |
| `lessons` | Уроки (название, контент, видео, субтитры, жестовый перевод) |
| `enrollments` | Записи на курсы (студент, курс, прогресс) |
| `lesson_progress` | Прогресс по урокам (студент, урок, завершён) |
| `quizzes` | Квизы (урок, название, проходной балл) |
| `questions` | Вопросы (квиз, текст ru/kz, порядок) |
| `answers` | Ответы (вопрос, текст ru/kz, правильный) |
| `quiz_attempts` | Попытки квизов (студент, квиз, балл, пройден) |

## Команды миграций

```bash
alembic upgrade head          # Применить все миграции
alembic downgrade base        # Откатить все миграции
alembic revision --autogenerate -m "описание"  # Создать новую миграцию
```

## Лицензия

Проект использует компоненты [shadcn/ui](https://ui.shadcn.com/) (MIT License).
