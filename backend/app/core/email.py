"""Email sending service — SMTP (primary) with Resend fallback."""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

_VERIFICATION_HTML = """\
<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#3b82f6);
                     padding:28px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">QazEdu Special</h1>
            <p style="color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px;">
              Платформа для слабослышащих детей
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">
              Добро пожаловать, {name}!
            </h2>
            <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
              Для завершения регистрации подтвердите ваш email-адрес,
              нажав на кнопку ниже.
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <a href="{url}"
                 style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);
                        color:#fff;padding:14px 32px;border-radius:8px;
                        text-decoration:none;font-size:16px;font-weight:600;">
                Подтвердить email
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
              Ссылка действительна <strong>24 часа</strong>.<br>
              Если вы не регистрировались на QazEdu Special — просто
              проигнорируйте это письмо.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 40px;
                     border-top:1px solid #e5e7eb;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              © 2026 QazEdu Special
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


_RESET_HTML = """\
<!DOCTYPE html>
<html lang="ru">
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 0;">
      <table width="560" cellpadding="0" cellspacing="0"
             style="background:#fff;border-radius:12px;overflow:hidden;
                    box-shadow:0 4px 24px rgba(0,0,0,.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#3b82f6);
                     padding:28px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;">QazEdu Special</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">
              {heading}
            </h2>
            <p style="color:#374151;line-height:1.6;margin:0 0 24px;">
              Привет, {name}! {intro}
            </p>
            <div style="text-align:center;margin:0 0 28px;">
              <a href="{url}"
                 style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);
                        color:#fff;padding:14px 32px;border-radius:8px;
                        text-decoration:none;font-size:16px;font-weight:600;">
                {cta}
              </a>
            </div>
            <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0;">
              Ссылка действительна <strong>1 час</strong>.<br>
              {ignore_note}
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 40px;
                     border-top:1px solid #e5e7eb;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              © 2026 QazEdu Special
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


async def _send_via_resend(to_email: str, subject: str, html: str) -> None:
    from_addr = f"{settings.smtp_from_name} <{settings.resend_from_email}>"
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api.resend.com/emails",
            headers={"Authorization": f"Bearer {settings.resend_api_key}"},
            json={"from": from_addr, "to": [to_email], "subject": subject, "html": html},
            timeout=15,
        )
        if resp.is_error:
            logger.error(
                "Resend email failed: status=%s body=%s",
                resp.status_code,
                resp.text[:1000],
            )
        resp.raise_for_status()


async def _send_via_smtp(to_email: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email or settings.smtp_username}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))
    await aiosmtplib.send(
        msg,
        hostname=settings.smtp_host,
        port=settings.smtp_port,
        start_tls=True,
        username=settings.smtp_username,
        password=settings.smtp_password,
        timeout=10,
    )


async def _send(to_email: str, subject: str, html: str) -> None:
    if settings.resend_api_key:
        try:
            await _send_via_resend(to_email, subject, html)
            return
        except Exception:
            if not (settings.smtp_username and settings.smtp_password):
                raise
            logger.exception("Resend failed; falling back to SMTP")

    if settings.smtp_username and settings.smtp_password:
        await _send_via_smtp(to_email, subject, html)
        return

    raise RuntimeError("Email provider is not configured")


async def send_verification_email(to_email: str, name: str, token: str) -> None:
    verify_url = f"{settings.backend_url.rstrip('/')}/api/auth/verify?token={token}"
    html = _VERIFICATION_HTML.format(name=name or to_email, url=verify_url)
    try:
        await _send(to_email, "Подтверждение аккаунта — QazEdu Special", html)
        logger.info("Verification email sent to %s", to_email)
    except Exception:
        logger.exception("Failed to send verification email to %s", to_email)
        raise


async def send_password_reset_email(
    to_email: str, name: str, token: str, *, is_new: bool = False
) -> None:
    """Send the password-reset email.

    `is_new=True` is used for OAuth-only accounts that don't have a password
    yet — the copy then reads as "set a password" instead of "reset".
    """
    reset_url = f"{settings.frontend_url.rstrip('/')}?reset_token={token}"
    if is_new:
        subject = "Установка пароля — QazEdu Special"
        copy = dict(
            heading="Установка пароля",
            intro=("Вы вошли через Google, и у вашего аккаунта ещё нет пароля. "
                   "Нажмите на кнопку ниже, чтобы задать пароль и входить также по email."),
            cta="Задать пароль",
            ignore_note="Если вы не запрашивали это — просто проигнорируйте письмо.",
        )
    else:
        subject = "Сброс пароля — QazEdu Special"
        copy = dict(
            heading="Сброс пароля",
            intro=("Мы получили запрос на сброс пароля для вашего аккаунта. "
                   "Нажмите на кнопку ниже, чтобы задать новый пароль."),
            cta="Сбросить пароль",
            ignore_note="Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.",
        )
    html = _RESET_HTML.format(name=name or to_email, url=reset_url, **copy)
    try:
        await _send(to_email, subject, html)
        logger.info("Password reset email sent to %s (is_new=%s)", to_email, is_new)
    except Exception:
        logger.exception("Failed to send password reset email to %s", to_email)
        raise
