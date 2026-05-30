# SECURITY.md

Документ описывает реализованные меры безопасности в **QazEdu Special**.

---

## 1. Аутентификация — JWT

**Файл:** `backend/app/core/security.py`

- Алгоритм: HS256
- Поля токена: `sub` (ID пользователя), `exp` (7 дней), `csrf` (см. §13), `tv` (token_version)
- Токен подписывается `SECRET_KEY` из переменных окружения
- Декодирование и проверка на каждом защищённом запросе — `get_current_user` в `backend/app/api/deps.py`
- **Отзыв сессий:** у пользователя есть `token_version`; он инкрементируется при сбросе пароля
  (`POST /api/auth/reset-password`), и токены, выпущенные раньше, перестают приниматься (`401`)
- При невалидном/отсутствующем/устаревшем токене — `401 Unauthorized`
- Тайминг входа выровнен: при несуществующем email выполняется фиктивная bcrypt-проверка
  (`DUMMY_PASSWORD_HASH`), чтобы ответ нельзя было отличить по времени (анти-энумерация)

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
- Смена email через `PATCH /api/me` сбрасывает `is_verified` и шлёт новую ссылку на новый адрес

---

## 4. Сброс пароля

**Файл:** `backend/app/api/auth.py`

- `POST /api/auth/forgot-password` — всегда возвращает `200 OK` (защита от перебора email-адресов)
- `reset_token` с TTL 1 час
- После использования токен обнуляется
- После сброса инкрементируется `token_version` → все ранее выпущенные сессии аннулируются
- Лимиты: 3 запроса/мин на `forgot-password`, 5 запросов/мин на `reset-password`

---

## 5. Google OAuth2

**Файл:** `backend/app/api/auth.py`

- Реализован через `authlib` + `SessionMiddleware` (itsdangerous)
- Серверный обмен кодами — токены не передаются через браузер
- Google OAuth пользователи получают `is_verified=True` автоматически
- Redirect URI формируется как `{BACKEND_URL}/api/auth/google/callback` и должен быть
  заранее зарегистрирован в Google Cloud Console (иначе `redirect_uri_mismatch`);
  в продакшене — `https://api.qazedu.uk/api/auth/google/callback`
- После колбэка бэкенд редиректит на `{FRONTEND_URL}?google=1` **без токенов в URL**;
  CSRF-токен SPA получает запросом `GET /api/auth/session` (читается из HttpOnly-cookie)
- Client ID / Client Secret хранятся только в переменных окружения

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
| `POST /api/me/password` | 5 запросов/мин |
| `POST /api/community/posts` | 10 запросов/мин |
| `POST /api/ai/chat` | 10 запросов/мин |

При превышении — `429 Too Many Requests`.

Ключ лимита — реальный IP клиента: за Render/Cloudflare он берётся из `CF-Connecting-IP`
или первого хопа `X-Forwarded-For` (`client_ip` в `limiter.py`), а не из адреса прокси.

**Вход в админку** (`backend/app/admin/auth.py`) не проходит через slowapi (это не
HTTP-route, а метод `AuthProvider`), поэтому защищён отдельным in-process счётчиком:
после 5 неудачных попыток с одного IP за 5 минут вход блокируется. При несуществующем
или беспарольном аккаунте выполняется фиктивная bcrypt-проверка (`DUMMY_PASSWORD_HASH`),
а сообщение об ошибке всегда одинаковое — нельзя ни перебрать пароль, ни узнать,
существует ли email и является ли он администратором.

---

## 7. Security Headers

**Файл:** `backend/app/main.py` — `SecurityHeadersMiddleware`  
**Файл:** `frontend/vercel.json` — заголовки для статики Vercel

Оба слоя (backend API и frontend) добавляют идентичный набор заголовков:

| Заголовок | Значение |
|-----------|----------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `0` (устаревший legacy-auditor явно отключён) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (форсирует HTTPS, защита от SSL-strip) |
| `Content-Security-Policy` | см. ниже |

**CSP (backend):** `'unsafe-eval'` намеренно отсутствует — продакшен-сборка его не требует.
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
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
| `POST /api/auth/register` с `role` ≠ `student` | запрещено — `403` (роли `teacher`/`admin` назначаются только через админку) |
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
- Production: `https://qazedu.uk`, `https://www.qazedu.uk`, `https://admin.qazedu.uk`
- `allow_credentials=True`, методы и заголовки без ограничений

---

## 10. Валидация входных данных

- Все тела запросов валидируются через Pydantic-схемы (`backend/app/schemas/*.py`)
- Формат email проверяется через `email-validator`
- Сложность пароля проверяется на backend: минимум 8 символов, 1 заглавная, 1 строчная, 1 цифра, 1 спецсимвол
- ORM (SQLModel) использует параметризованные запросы — SQL-инъекции исключены
- Уникальность email проверяется при регистрации
- Запрет повторного создания теста для одного урока
- Проверка принадлежности ответов к вопросу при сдаче теста
- Защита от дублирования лайков (уникальная пара `post_id` + `user_id`)

---

## 11. Email-сервис

**Файл:** `backend/app/core/email.py`

Приоритет отправки: **Resend API → SMTP** (если задан `RESEND_API_KEY` — используется Resend, иначе SMTP).

- **Production (Render):** Resend API по HTTPS — исходящий SMTP (порт 587) заблокирован на Render
- Отправитель Resend задаётся `RESEND_FROM_EMAIL` (по умолчанию тестовый `onboarding@resend.dev`,
  который доставляет только владельцу аккаунта Resend); в продакшене — `noreply@qazedu.uk`,
  домен `qazedu.uk` верифицирован в Resend (DKIM / SPF / DMARC)
- **SMTP-fallback** (`aiosmtplib`, STARTTLS, `timeout=10`) — годится только локально
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

- JWT хранится в **HttpOnly cookie** — JavaScript не имеет доступа к токену
- CSRF-токен хранится в `localStorage`, передаётся в заголовке `X-CSRF-Token` при каждом мутирующем запросе
- Backend валидирует CSRF-заголовок для всех `POST/PUT/PATCH/DELETE` запросов
- Все запросы отправляются с `credentials: 'include'` — cookie автоматически прикрепляется браузером
- При `401` — CSRF-токен и данные пользователя очищаются, пользователь разлогинивается
- Ролевая защита UI (страницы admin / teacher) — дополнительный слой; основная защита на backend
- После Google OAuth callback бэкенд ставит JWT в HttpOnly cookie и редиректит на `?google=1`;
  CSRF-токен SPA забирает запросом `GET /api/auth/session` — в URL он не попадает

---

