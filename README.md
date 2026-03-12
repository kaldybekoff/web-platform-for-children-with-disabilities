# QazEdu Special

Образовательная платформа для глухих и слабослышащих детей с поддержкой жестового языка.

## О проекте

QazEdu Special — веб-платформа дистанционного обучения для детей с нарушениями слуха. Платформа обеспечивает доступное инклюзивное образование с поддержкой видеоуроков, интерактивных тестов и системы достижений.

### Основные возможности

- **Курсы и уроки** — структурированные учебные материалы с видео, субтитрами и поддержкой жестового языка
- **Интерактивные квизы** — тестирование знаний с мгновенной обратной связью
- **Система прогресса** — отслеживание обучения с достижениями и статистикой
- **Сообщество** — стена успехов для мотивации и учебные друзья
- **AI-помощник** — интеграция с Google Gemini для помощи в обучении
- **Новости платформы** — актуальные объявления от администрации
- **Три роли** — ученик, учитель, администратор с разными возможностями
- **Двуязычность** — интерфейс на русском и казахском языках
- **Тёмная/светлая тема** — адаптивный дизайн для комфортного использования

## Технологии

| Компонент | Стек |
|-----------|------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend | FastAPI, SQLModel, PostgreSQL/SQLite, Alembic |
| Аутентификация | JWT (JSON Web Tokens) |
| AI | Google Gemini API |

## Структура проекта

```
edu-platform/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── api/               # API-клиент (auth, courses, community, ai, ...)
│   │   ├── components/        # UI-компоненты (страницы, формы, админка)
│   │   └── contexts/          # React-контексты (Auth, Theme, Language)
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                   # FastAPI
    ├── app/
    │   ├── api/               # Роуты (auth, courses, lessons, quizzes, admin, teacher, news, community, ai)
    │   ├── models/            # Модели БД (User, Course, Lesson, Quiz, News, SuccessPost, ...)
    │   ├── schemas/           # Pydantic-схемы
    │   ├── core/              # Конфигурация, безопасность, seed
    │   └── db/                # Сессия БД
    ├── alembic/               # Миграции базы данных
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

Создайте файл `.env` в папке `backend/`:

```env
# База данных (PostgreSQL или SQLite по умолчанию)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# AI (опционально)
GEMINI_API_KEY=your-gemini-api-key
```

Запустите сервер:

```bash
# Применить миграции (PostgreSQL)
alembic upgrade head

# Запустить сервер
uvicorn app.main:app --reload --port 8000
```

> При использовании SQLite миграции применяются автоматически при старте.

Backend: http://localhost:8000  
Swagger UI: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Frontend: http://localhost:5173

> Vite проксирует запросы `/api` на backend.

## Функционал по ролям

### Ученик (student)
- Просмотр каталога курсов и запись на них
- Прохождение уроков с видео и субтитрами
- Выполнение квизов с проверкой знаний
- Отслеживание прогресса и достижений в профиле
- Публикация успехов в сообществе
- Просмотр учебных друзей (студенты с общими курсами)
- Общение с AI-помощником
- Чтение новостей платформы
- Редактирование профиля и смена пароля

### Учитель (teacher)
- Создание и редактирование своих курсов
- Добавление и управление уроками
- Создание квизов с вопросами и ответами
- Просмотр статистики по своим студентам
- Статистика по попыткам квизов студентов
- Участие в сообществе
- Редактирование профиля и смена пароля

### Администратор (admin)
- Полная статистика платформы
- Управление всеми пользователями
- Изменение ролей пользователей
- Управление всеми курсами
- Создание и публикация новостей

## API Endpoints

### Аутентификация
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/auth/register` | Регистрация (student/teacher) |
| POST | `/api/auth/login` | Вход (получение токена) |

### Профиль пользователя
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/me` | Текущий пользователь |
| PATCH | `/api/me` | Обновление профиля (имя, email) |
| POST | `/api/me/password` | Смена пароля |
| GET | `/api/me/achievements` | Статистика достижений |
| GET | `/api/me/study-friends` | Учебные друзья |

### Курсы
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/courses` | Список курсов |
| POST | `/api/courses` | Создать курс (учитель/админ) |
| GET | `/api/courses/{id}` | Получить курс |
| PATCH | `/api/courses/{id}` | Обновить курс |
| DELETE | `/api/courses/{id}` | Удалить курс |
| POST | `/api/courses/{id}/enroll` | Записаться на курс |
| GET | `/api/my-courses` | Мои записи на курсы |

### Уроки
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/courses/{id}/lessons` | Уроки курса |
| GET | `/api/lessons/{id}` | Получить урок |
| POST | `/api/lessons` | Создать урок |
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
| POST | `/api/questions/{id}/check` | Проверить ответ |
| PATCH | `/api/answers/{id}` | Обновить ответ |
| DELETE | `/api/answers/{id}` | Удалить ответ |
| POST | `/api/quizzes/{id}/submit` | Отправить ответы квиза |
| GET | `/api/quizzes/{id}/my-attempts` | Мои попытки |

### Новости
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/news` | Опубликованные новости |
| GET | `/api/news/{id}` | Получить новость |
| GET | `/api/news/admin/all` | Все новости (админ) |
| POST | `/api/news` | Создать новость (админ) |
| PATCH | `/api/news/{id}` | Обновить новость (админ) |
| DELETE | `/api/news/{id}` | Удалить новость (админ) |

### Сообщество
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/community/posts` | Список постов успехов |
| POST | `/api/community/posts` | Создать пост |
| POST | `/api/community/posts/{id}/like` | Лайк/анлайк поста |
| DELETE | `/api/community/posts/{id}` | Удалить пост |

### AI-помощник
| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/api/ai/chat` | Отправить сообщение AI |

### Админ
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/admin/stats` | Статистика платформы |
| GET | `/api/admin/users` | Список пользователей (с пагинацией и фильтрами) |
| GET | `/api/admin/users/{id}` | Получить пользователя |
| PATCH | `/api/admin/users/{id}/role` | Изменить роль |
| DELETE | `/api/admin/users/{id}` | Удалить пользователя |

### Учитель
| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/api/teacher/stats` | Статистика учителя |
| GET | `/api/teacher/students` | Студенты с прогрессом и статистикой квизов |

## База данных

| Таблица | Описание |
|---------|----------|
| `users` | Пользователи (email, пароль, имя, фамилия, роль) |
| `courses` | Курсы (название, описание, уровень, учитель) |
| `lessons` | Уроки (название, контент, видео, субтитры, жестовый перевод) |
| `enrollments` | Записи на курсы (студент, курс, прогресс) |
| `lesson_progress` | Прогресс по урокам (студент, урок, завершён, время просмотра) |
| `quizzes` | Квизы (урок, название, проходной балл) |
| `questions` | Вопросы (квиз, текст ru/kz, порядок) |
| `answers` | Ответы (вопрос, текст ru/kz, правильный, порядок) |
| `quiz_attempts` | Попытки квизов (студент, квиз, балл, пройден) |
| `news` | Новости (заголовок ru/kz, контент ru/kz, видео, изображение, статус публикации) |
| `success_posts` | Посты успехов сообщества (автор, контент, лайки) |
| `success_post_likes` | Лайки постов (пост, пользователь) |

## Команды миграций

```bash
alembic upgrade head          # Применить все миграции
alembic downgrade base        # Откатить все миграции
alembic revision --autogenerate -m "описание"  # Создать новую миграцию
```

## Лицензия

Проект использует компоненты [shadcn/ui](https://ui.shadcn.com/) (MIT License).
