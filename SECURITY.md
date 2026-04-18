# SECURITY.md

Фактически реализованные меры безопасности в **QazEdu Special**.

## 1. Аутентификация — JWT

- Токен создаётся в `backend/app/core/security.py` через `python-jose` (алгоритм HS256).
- Поля токена: `sub` (ID пользователя), `exp` (7 дней).
- Подписывается `SECRET_KEY` из переменных окружения.
- `get_current_user` в `backend/app/api/deps.py` декодирует и проверяет токен на каждом защищённом запросе.
- При невалидном или отсутствующем токене — 401 с заголовком `WWW-Authenticate: Bearer`.

## 2. Безопасность паролей

- Хранится только `password_hash` (bcrypt), пароль никогда не возвращается в ответах.
- `hash_password` / `verify_password` в `backend/app/core/security.py`.
- Усечение до 72 байт (`MAX_PASSWORD_BYTES`) — предотвращает некорректную работу bcrypt с длинными паролями.
- Google OAuth пользователи создаются без пароля (`password_hash=None`).

## 3. Email верификация

- При регистрации генерируется `verification_token` (случайный, URL-safe), TTL 24 часа.
- Вход невозможен без подтверждения email (`is_verified=False` → 403).
- После верификации токен обнуляется, `is_verified=True`.
- Повторная отправка ограничена: 3 запроса/мин.

## 4. Сброс пароля

- `POST /api/auth/forgot-password` — всегда возвращает 200 (защита от перебора email).
- Генерируется `reset_token` с TTL 1 час.
- После использования токен обнуляется.
- Ограничение: 3 запроса/мин на forgot, 5/мин на reset.

## 5. Google OAuth

- Реализован через `authlib` + `SessionMiddleware` (itsdangerous).
- Google OAuth пользователи сразу `is_verified=True`.
- Redirect URI проверяется на стороне Google.

## 6. Rate Limiting (slowapi)

Реализован в `backend/app/core/limiter.py`, применяется в `backend/app/api/auth.py`:

| Endpoint | Лимит |
|----------|-------|
| `POST /api/auth/register` | 5 запросов/мин |
| `POST /api/auth/login` | 10 запросов/мин |
| `POST /api/auth/resend-verification` | 3 запроса/мин |
| `POST /api/auth/forgot-password` | 3 запроса/мин |
| `POST /api/auth/reset-password` | 5 запросов/мин |

При превышении — 429 Too Many Requests.

## 7. Security Headers (XSS защита)

`SecurityHeadersMiddleware` в `backend/app/main.py` добавляет заголовки ко всем ответам:

| Заголовок | Значение |
|-----------|----------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | скрипты, стили, фреймы — ограничены по источникам |

CSP разрешает: `'self'`, `cdn.jsdelivr.net` (Swagger UI), YouTube фреймы, HTTPS источники для медиа.

## 8. Роли и авторизация

Три роли: `student`, `teacher`, `admin`.

Функции в `backend/app/api/deps.py`:
- `require_teacher_or_admin` — 403 если не teacher/admin
- `require_admin` — 403 если не admin

| Роут | Защита |
|------|--------|
| `POST /api/auth/register` с `role=admin` | 403 запрещено |
| `/api/admin/*` | только admin |
| Создание/редактирование курсов, уроков, квизов | только teacher-владелец или admin |
| Удаление поста сообщества | автор или admin |
| Управление новостями | только admin |
| `/api/ai/chat` | любой аутентифицированный |

## 9. CORS

`CORSMiddleware` в `backend/app/main.py`:
- `allow_origins` — из `CORS_ORIGINS` в `.env` (через запятую)
- `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`

По умолчанию: `http://localhost:5173, http://localhost:3000`

## 10. Валидация входных данных

- Все входные данные типизированы через Pydantic-схемы (`backend/app/schemas/*.py`).
- Уникальность email проверяется при регистрации.
- Запрет пустого контента в постах сообщества.
- Запрет повторного создания квиза для одного урока.
- Проверка принадлежности ответов к вопросу при сдаче квиза.
- ORM (SQLModel) использует параметризованные запросы — SQL-инъекции исключены.

## 11. Переменные окружения и секреты

- Все секреты загружаются через `pydantic-settings` из `.env`.
- `.env` и все `*.env.*` в `.gitignore` — не попадают в репозиторий.
- `SECRET_KEY` обязателен — без него приложение не стартует.
- При пустом `GEMINI_API_KEY` — `/api/ai/chat` возвращает 503.
- На фронтенде нет секретов — только `VITE_API_URL`.

## 12. Email сервис

Приоритет отправки: **Brevo → Resend → SMTP**.
- Если ни один не настроен — email верификация отключена, `is_verified=True` при регистрации.
- Ошибки отправки логируются но не блокируют регистрацию (фоновая задача).

## 13. Фронтенд

- Токен хранится в `localStorage` (стандарт для SPA).
- `Authorization: Bearer <token>` добавляется централизованно в `frontend/src/api/client.ts`.
- При 401 — токен сбрасывается, пользователь разлогинивается.
- Ролевая защита UI (admin/teacher страницы) — дополнительный слой, основная защита на backend.
- Google OAuth callback обрабатывается через URL параметры (`?auth_token=`, `?auth_error=`).

## 14. Ограничения

- Нет refresh-токенов — только один JWT, без механизма обновления.
- `localStorage` уязвим к XSS — нет HTTP-only cookies.
- Нет CSRF-токенов (Bearer-токен частично защищает).
- Нет проверки сложности пароля на backend (только на фронте).
- Нет аудита действий (логин/смена пароля не логируются в отдельный журнал).
- Нет rate limit на `/api/ai/chat`.
- Все удаления физические — нет soft delete.
