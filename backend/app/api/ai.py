"""AI Chat endpoint using Google Gemini API."""

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.core.config import settings

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
async def chat_with_ai(
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
        error_message = str(e)
        if "API_KEY" in error_message.upper() or "AUTHENTICATION" in error_message.upper():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service authentication error",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {error_message[:100]}",
        )
