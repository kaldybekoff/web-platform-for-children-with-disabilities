"""AI Chat endpoint using Google Gemini API."""

import logging

from fastapi import APIRouter, HTTPException, Request, status, Depends
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.core.config import settings
from app.core.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


SYSTEM_PROMPT = """Ты — дружелюбный и полезный AI-помощник образовательной платформы QazEdu Special.
QazEdu — это платформа дистанционного обучения для детей с особыми потребностями.

Твоя задача:
- Помогать студентам с учебными вопросами
- Объяснять сложные темы простым и понятным языком
- Отвечать кратко, но информативно
- Быть терпеливым и поддерживающим
- Если вопрос не связан с учёбой, вежливо направить разговор к образовательным темам

Отвечай на том языке, на котором задан вопрос (русский или казахский).
Используй простые предложения и избегай сложной терминологии без объяснений."""


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("10/minute")
async def chat_with_ai(
    request: Request,
    body: ChatRequest,
    current_user: CurrentUser,
):
    """Send a message to AI and get a response."""
    if not body.message or not body.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty",
        )
    
    gemini_api_key = settings.gemini_api_key
    if not gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured",
        )
    
    try:
        from google import genai
        
        client = genai.Client(api_key=gemini_api_key)
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[
                {"role": "user", "parts": [{"text": SYSTEM_PROMPT}]},
                {"role": "model", "parts": [{"text": "Понял! Я готов помочь студентам QazEdu с их учебными вопросами."}]},
                {"role": "user", "parts": [{"text": body.message.strip()}]},
            ],
        )
        
        reply = response.text if response.text else "Извините, не удалось получить ответ. Попробуйте переформулировать вопрос."
        
        return ChatResponse(reply=reply)
        
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI library not installed",
        )
    except Exception as e:
        # Log the real error server-side; never echo upstream exception text to the client.
        logger.exception("AI chat request failed")
        error_message = str(e).upper()
        if "API_KEY" in error_message or "AUTHENTICATION" in error_message:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service is temporarily unavailable",
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service error, please try again later",
        )
