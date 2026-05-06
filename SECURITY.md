# SECURITY.md

Документ описывает реализованные меры безопасности в **QazEdu Special**.

---

## 1. Аутентификация — JWT

**Файл:** `backend/app/core/security.py`

- Алгоритм: HS256
- Поля токена: `sub` (ID пользователя), `exp` (7 дней)
- Токен подписывается `SECRET_KEY` из переменных окружения
- Декодирование и проверка на каждом защищённом запросе — `get_current_user` в `backend/app/api/deps.py`
- При невалидном или отсутствующем токене — `401 Unauthorized` с заголовком `WWW-Authenticate: Bearer`

---

## 2. Хэширование паролей

**Файл:** `backend/app/core/security.py`

- Хранится только `password_hash` (bcrypt с автоматической солью)
- Пароль никогда не возвращается в ответах API
- Усечение входных данных до 72 байт (`MAX_PASSWORD_BYTES`) — устраняет некорректную обработку длинных паролей bcrypt
- Пользователи через Google OAuth создаются без `password_hash`

---

## 3. Email-верификация

**Файл:** `backend/app/api/auth.py`

- При регистрации генерируется URL-safe случайный `verification_token`, TTL — 24 часа
- Вход заблокирован при `is_verified=False` → `403 Forbidden`
- После перехода по ссылке токен обнуляется, `is_verified=True`
- Повторная отправка: лимит 3 запроса/мин

---

## 4. Сброс пароля

**Файл:** `backend/app/api/auth.py`

- `POST /api/auth/forgot-password` — всегда возвращает `200 OK` (защита от перебора email-адресов)
- `reset_token` с TTL 1 час
- После использования токен обнуляется
- Лимиты: 3 запроса/мин на `forgot-password`, 5 запросов/мин на `reset-password`

---

## 5. Google OAuth2

**Файл:** `backend/app/api/auth.py`

- Реализован через `authlib` + `SessionMiddleware` (itsdangerous)
- Серверный обмен кодами — токены не передаются через браузер
- Google OAuth пользователи получают `is_verified=True` автоматически
- Redirect URI верифицируется на стороне Google

---

## 6. Rate Limiting

**Файл:** `backend/app/core/limiter.py`  
**Библиотека:** slowapi

| Endpoint | Лимит |
|----------|-------|
| `POST /api/auth/register` | 5 запросов/мин |
| `POST /api/auth/login` | 10 запросов/мин |
| `POST /api/auth/resend-verification` | 3 запроса/мин |
| `POST /api/auth/forgot-password` | 3 запроса/мин |
| `POST /api/auth/reset-password` | 5 запросов/мин |

При превышении — `429 Too Many Requests`.

---

## 7. Security Headers

**Файл:** `backend/app/main.py` — `SecurityHeadersMiddleware`  
**Файл:** `frontend/vercel.json` — заголовки для статики Vercel

Оба слоя (backend API и frontend) добавляют идентичный набор заголовков:

| Заголовок | Значение |
|-----------|----------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | см. ниже |

**CSP (backend):**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
img-src 'self' data: https:;
media-src 'self' https:;
frame-src https://www.youtube.com;
connect-src 'self' https:;
font-src 'self' data: https://cdn.jsdelivr.net;
```

---

## 8. Роли и авторизация

**Файл:** `backend/app/api/deps.py`

Три роли: `student`, `teacher`, `admin`.

Функции защиты:
- `require_teacher_or_admin` — `403` если роль `student`
- `require_admin` — `403` если роль не `admin`
- `is_enrolled` — проверка записи студента на курс перед доступом к урокам и тестам

| Ресурс | Ограничение |
|--------|-------------|
| `POST /api/auth/register` с `role=admin` | запрещено — `403` |
| `/api/admin/*` | только admin |
| Создание / редактирование курсов, уроков, тестов | только teacher-владелец или admin |
| Удаление поста сообщества | автор или admin |
| Управление новостями | только admin |
| Результаты тестов и прогресс | приватны, доступны только владельцу |

---

## 9. CORS

**Файл:** `backend/app/main.py`

- `allow_origins` — из переменной `CORS_ORIGINS` (`.env`)
- По умолчанию: `http://localhost:5173`, `http://localhost:3000`
- Production: `https://qazedu.vercel.app`
- `allow_credentials=True`, методы и заголовки без ограничений

---

## 10. Валидация входных данных

- Все тела запросов валидируются через Pydantic-схемы (`backend/app/schemas/*.py`)
- Формат email проверяется через `email-validator`
- ORM (SQLModel) использует параметризованные запросы — SQL-инъекции исключены
- Уникальность email проверяется при регистрации
- Запрет повторного создания теста для одного урока
- Проверка принадлежности ответов к вопросу при сдаче теста
- Защита от дублирования лайков (уникальная пара `post_id` + `user_id`)

---

## 11. Email-сервис

**Файл:** `backend/app/core/email.py`

Приоритет отправки: **Brevo API → Resend API → SMTP**.

- **Production (Render):** Resend API — исходящий SMTP заблокирован на бесплатном тарифе Render
- **Локально:** Gmail SMTP с App Password
- Если ни один провайдер не настроен — email-верификация отключена, `is_verified=True` при регистрации
- Ошибки отправки логируются, но не блокируют завершение запроса

---

## 12. Защита конфигурации

- Все секреты загружаются через `pydantic-settings` из `.env`
- `.env` и `*.env.*` находятся в `.gitignore` — не попадают в репозиторий
- `SECRET_KEY` обязателен — без него приложение не запускается
- При пустом `GEMINI_API_KEY` — `/api/ai/chat` возвращает `503`
- На фронтенде нет секретов — только публичный `VITE_API_URL`
- Соединение с БД: `pool_pre_ping=True`, `pool_recycle=300` — устойчивость к разрыву idle-соединений (Neon PostgreSQL)

---

## 13. Frontend

- JWT-токен хранится в `localStorage`
- `Authorization: Bearer <token>` добавляется централизованно в `frontend/src/api/client.ts`
- При `401` — токен сбрасывается, пользователь разлогинивается автоматически
- Ролевая защита UI (страницы admin / teacher) — дополнительный слой; основная защита на backend
- Google OAuth callback обрабатывается через URL-параметры (`?auth_token=`, `?auth_error=`)

---

## 14. Известные ограничения

| Ограничение | Описание |
|-------------|----------|
| Нет refresh-токенов | JWT действителен 7 дней без механизма обновления |
| `localStorage` для токена | уязвим к XSS; HTTP-only cookies не используются |
| Нет CSRF-защиты | Bearer-токен частично компенсирует риск |
| Нет server-side проверки сложности пароля | валидация только на фронтенде |
| Нет аудит-лога | действия пользователей не фиксируются в отдельном журнале |
| Нет rate limit на `/api/ai/chat` | ограничение только со стороны Google Gemini API |
| Физическое удаление | soft delete не реализован |
| Токены не отзываются | удаление пользователя не инвалидирует существующие JWT |
