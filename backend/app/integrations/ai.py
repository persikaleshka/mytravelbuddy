import json
import logging
import os
import re
from typing import Any, Protocol
from pydantic import BaseModel, Field, ValidationError, field_validator

logger = logging.getLogger(__name__)


class AIPlace(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    city: str = Field(min_length=1, max_length=120)
    day: int | None = Field(default=None, ge=1, le=31)
    category: str | None = Field(default=None, max_length=40)
    reason: str | None = Field(default=None, max_length=300)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("name", "city", mode="before")
    @classmethod
    def clean_required_text(cls, value: Any) -> str:
        if not isinstance(value, str):
            raise ValueError("must be string")
        clean = value.strip()
        if not clean:
            raise ValueError("must not be empty")
        return clean

    @field_validator("category", "reason", mode="before")
    @classmethod
    def clean_optional_text(cls, value: Any) -> str | None:
        if value is None:
            return None
        if not isinstance(value, str):
            return None
        clean = value.strip()
        return clean if clean else None


class AIStructuredResponse(BaseModel):
    summary: list[str] = Field(default_factory=list, max_length=4)
    plan: list[str] = Field(default_factory=list, max_length=10)
    questions: list[str] = Field(default_factory=list, max_length=4)
    places: list[AIPlace] = Field(default_factory=list, max_length=10)

    @field_validator("summary", "plan", "questions", mode="before")
    @classmethod
    def clean_text_list(cls, value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        out: list[str] = []
        for item in value:
            if not isinstance(item, str):
                continue
            text = item.strip()
            if text and text not in out:
                out.append(text)
        return out


class LLMProvider(Protocol):
    def generate(
        self,
        *,
        system_prompt: str,
        history: list[dict[str, str]],
        user_message: str,
    ) -> str | None:
        ...


class OpenRouterProvider:
    def __init__(
        self,
        api_key: str,
        model: str,
        timeout_seconds: float,
        base_url: str = "https://openrouter.ai/api/v1/chat/completions",
    ):
        self.api_key = api_key.strip()
        self.model = model.strip()
        self.timeout_seconds = timeout_seconds
        self.base_url = base_url.rstrip("/")

    def generate(
        self,
        *,
        system_prompt: str,
        history: list[dict[str, str]],
        user_message: str,
    ) -> str | None:
        if not self.api_key or not self.model:
            logger.warning("OpenRouter provider is not configured: missing api key or model")
            return None

        try:
            import httpx
        except Exception:
            return None

        messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
        for item in history:
            sender = item.get("sender", "user")
            text = item.get("text", "")
            if not text:
                continue
            role = "assistant" if sender == "assistant" else "user"
            messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": user_message})

        timeout = httpx.Timeout(timeout=self.timeout_seconds, connect=min(self.timeout_seconds, 15.0))
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("OPENROUTER_SITE_URL", "http://localhost:8000"),
            "X-Title": os.getenv("OPENROUTER_APP_NAME", "MyTravelBuddy"),
        }
        payload = {"model": self.model, "messages": messages, "temperature": 0.35}

        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(self.base_url, headers=headers, json=payload)
        except Exception as exc:
            logger.warning("OpenRouter request failed (model=%s): %s", self.model, str(exc))
            return None

        if response.status_code >= 400:
            logger.warning(
                "OpenRouter returned %s (model=%s): %s",
                response.status_code,
                self.model,
                response.text[:400],
            )
            return None

        try:
            data = response.json()
        except Exception as exc:
            logger.warning("OpenRouter invalid JSON (model=%s): %s", self.model, str(exc))
            return None

        choices = data.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                message = first.get("message")
                if isinstance(message, dict):
                    content = message.get("content")
                    if isinstance(content, str) and content.strip():
                        return content.strip()

        logger.warning("OpenRouter empty response (model=%s): %s", self.model, str(data)[:400])
        return None


class OllamaProvider:
    def __init__(self, base_url: str, model: str, timeout_seconds: float):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout_seconds = timeout_seconds

    def _base_url_candidates(self) -> list[str]:
        base = self.base_url.rstrip("/")
        candidates = [base]

        if "127.0.0.1" in base or "localhost" in base:
            candidates.append(base.replace("127.0.0.1", "host.docker.internal"))
            candidates.append(base.replace("localhost", "host.docker.internal"))
        elif "host.docker.internal" in base:
            candidates.append(base.replace("host.docker.internal", "127.0.0.1"))
            candidates.append(base.replace("host.docker.internal", "localhost"))

        env_fallback = os.getenv("OLLAMA_FALLBACK_BASE_URL", "").strip()
        if env_fallback:
            candidates.append(env_fallback.rstrip("/"))

        unique: list[str] = []
        for value in candidates:
            if value and value not in unique:
                unique.append(value)
        return unique

    def _build_prompt(
        self,
        *,
        system_prompt: str,
        history: list[dict[str, str]],
        user_message: str,
    ) -> str:
        history_block = []
        for item in history:
            sender = item.get("sender", "user")
            text = item.get("text", "")
            if not text:
                continue
            role = "Пользователь" if sender == "user" else "Ассистент"
            history_block.append(f"{role}: {text}")

        history_text = "\n".join(history_block) if history_block else "История пуста."
        return (
            f"{system_prompt}\n\n"
            "История диалога (последние сообщения):\n"
            f"{history_text}\n\n"
            f"Текущее сообщение пользователя: {user_message}\n"
            "Ответ:"
        )

    def generate(
        self,
        *,
        system_prompt: str,
        history: list[dict[str, str]],
        user_message: str,
    ) -> str | None:
        try:
            import httpx
        except Exception:
            return None

        prompt = self._build_prompt(
            system_prompt=system_prompt,
            history=history,
            user_message=user_message,
        )
        timeout = httpx.Timeout(timeout=self.timeout_seconds, connect=min(self.timeout_seconds, 10.0))

        for base_url in self._base_url_candidates():
            try:
                with httpx.Client(timeout=timeout) as client:
                    response = client.post(
                        f"{base_url}/api/generate",
                        json={
                            "model": self.model,
                            "prompt": prompt,
                            "stream": False,
                            "options": {"temperature": 0.35},
                        },
                    )
            except Exception as exc:
                logger.warning(
                    "Ollama request failed (%s, model=%s): %s",
                    base_url,
                    self.model,
                    str(exc),
                )
                continue

            if response.status_code >= 400:
                logger.warning(
                    "Ollama returned %s (%s, model=%s): %s",
                    response.status_code,
                    base_url,
                    self.model,
                    response.text[:300],
                )
                continue

            try:
                payload = response.json()
            except Exception as exc:
                logger.warning("Ollama invalid JSON (%s, model=%s): %s", base_url, self.model, str(exc))
                continue

            output_text = payload.get("response") if isinstance(payload, dict) else None
            if isinstance(output_text, str) and output_text.strip():
                return output_text.strip()

            logger.warning(
                "Ollama empty response (%s, model=%s): %s",
                base_url,
                self.model,
                str(payload)[:300],
            )

        return None


class FallbackProvider:
    def __init__(self, route_name: str, city: str):
        self.route_name = route_name
        self.city = city

    def generate(
        self,
        *,
        system_prompt: str,
        history: list[dict[str, str]],
        user_message: str,
    ) -> str | None:
        return _fallback_reply(self.route_name, self.city, user_message)


def _clean_list(values: Any, *, limit: int) -> list[str]:
    if not isinstance(values, list):
        return []
    result: list[str] = []
    for item in values:
        if not isinstance(item, str):
            continue
        value = item.strip()
        if not value:
            continue
        if value not in result:
            result.append(value)
        if len(result) >= limit:
            break
    return result


def _normalize_structured(data: dict[str, Any], city: str) -> dict[str, Any]:
    base = {
        "summary": data.get("summary"),
        "plan": data.get("plan"),
        "questions": data.get("questions"),
        "places": data.get("places"),
    }

    raw_places = base.get("places")
    if isinstance(raw_places, list):
        normalized_places: list[dict[str, Any]] = []
        for raw in raw_places:
            if not isinstance(raw, dict):
                continue
            place = dict(raw)
            if not isinstance(place.get("city"), str) or not place.get("city", "").strip():
                place["city"] = city
            normalized_places.append(place)
            if len(normalized_places) >= 10:
                break
        base["places"] = normalized_places

    try:
        parsed = AIStructuredResponse.model_validate(base)
    except ValidationError:
        return {
            "summary": [],
            "plan": [],
            "questions": [],
            "places": [],
        }
    return parsed.model_dump()


def _fallback_structured(route_name: str, city: str, user_text: str) -> dict[str, Any]:
    return {
        "summary": [f"Запрос принят по поездке '{route_name}' в {city}."],
        "plan": [f"Запрос: {user_text[:220]}"],
        "questions": ["Уточни приоритет: музеи/еда/прогулки.", "Уточни ограничения по времени и бюджету."],
        "places": [],
    }


def _render_structured_text(structured: dict[str, Any]) -> str:
    summary = _clean_list(structured.get("summary"), limit=4)
    plan = _clean_list(structured.get("plan"), limit=10)
    questions = _clean_list(structured.get("questions"), limit=4)

    lines: list[str] = []
    if summary:
        lines.extend(f"- {item}" for item in summary)
    else:
        lines.append("- Собрал основу маршрута и подбор мест.")

    if plan:
        lines.append("")
        for idx, item in enumerate(plan, start=1):
            lines.append(f"{idx}. {item}")
    else:
        lines.append("")
        lines.append("1. Уточни пожелания, и я соберу маршрут по дням.")

    if questions:
        lines.append("")
        lines.extend(f"- {item}" for item in questions)

    places = structured.get("places")
    if isinstance(places, list) and places:
        lines.append("")
        for item in places[:8]:
            if not isinstance(item, dict):
                continue
            name = item.get("name")
            if not isinstance(name, str) or not name.strip():
                continue
            city = item.get("city")
            day = item.get("day")
            suffix_parts: list[str] = []
            if isinstance(city, str) and city.strip():
                suffix_parts.append(city.strip())
            if isinstance(day, int) and day > 0:
                suffix_parts.append(f"день {day}")
            suffix = f" ({', '.join(suffix_parts)})" if suffix_parts else ""
            lines.append(f"- {name.strip()}{suffix}")

    return "\n".join(lines).strip()


def _extract_json_text(raw_text: str) -> str | None:
    text = (raw_text or "").strip()
    if not text:
        return None

    fence_match = re.search(r"```(?:json)?\s*(.*?)```", text, flags=re.IGNORECASE | re.DOTALL)
    if fence_match:
        fenced = fence_match.group(1).strip()
        if fenced:
            return fenced

    if text.startswith("{") and text.endswith("}"):
        return text

    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        return text[start : end + 1]
    return None


def _parse_structured_output(raw_text: str, city: str) -> dict[str, Any] | None:
    json_text = _extract_json_text(raw_text)
    if not json_text:
        return None
    try:
        payload = json.loads(json_text)
    except Exception:
        return None
    if not isinstance(payload, dict):
        return None
    return _normalize_structured(payload, city)


def _fallback_reply(route_name: str, city: str, user_text: str) -> str:
    return _render_structured_text(_fallback_structured(route_name, city, user_text))


def _build_system_prompt(
    *,
    route_name: str,
    city: str,
    start_date: str,
    end_date: str,
    preferences: str,
) -> str:
    return (
        "Ты туристический ассистент в веб-приложении MyTravelBuddy. "
        "Отвечай только на русском, кратко и по делу.\n"
        f"Контекст поездки: '{route_name}', город: {city}, даты: {start_date} — {end_date}.\n"
        f"Предпочтения пользователя: {preferences or 'не указаны'}.\n"
        "Верни СТРОГО один JSON-объект без markdown и без пояснений.\n"
        "JSON-схема ответа:\n"
        "{"
        '"summary": ["..."], '
        '"plan": ["..."], '
        '"questions": ["..."], '
        '"places": ['
        "{"
        '"name":"...", '
        '"city":"...", '
        '"day":1, '
        '"category":"museum|cafe|park|other", '
        '"reason":"...", '
        '"latitude": 59.93, '
        '"longitude": 30.31'
        "}"
        "]"
        "}\n"
        "Ограничения:\n"
        "- summary: 1-3 коротких пункта\n"
        "- plan: 3-7 пунктов, понятные и приятные для чтения\n"
        "- questions: 0-2 пункта\n"
        "- places: 3-8 мест, если есть достаточно контекста\n"
        "- Если координаты не знаешь точно, верни latitude/longitude = null"
    )


def _get_provider(route_name: str, city: str) -> LLMProvider:
    provider_name = os.getenv("AI_PROVIDER", "ollama").lower().strip()
    timeout_seconds = float(os.getenv("EXTERNAL_TIMEOUT_SECONDS", "20"))

    if provider_name == "openrouter":
        return OpenRouterProvider(
            api_key=os.getenv("OPENROUTER_API_KEY", ""),
            model=os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.2-3b-instruct:free"),
            timeout_seconds=timeout_seconds,
            base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions"),
        )

    if provider_name == "ollama":
        return OllamaProvider(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
            model=os.getenv("OLLAMA_MODEL", "llama3.1"),
            timeout_seconds=timeout_seconds,
        )
    return FallbackProvider(route_name, city)


def generate_trip_assistant_output(
    route_name: str,
    city: str,
    start_date: str,
    end_date: str,
    preferences: str,
    history: list[dict[str, str]],
    user_text: str,
) -> dict[str, Any]:
    system_prompt = _build_system_prompt(
        route_name=route_name,
        city=city,
        start_date=start_date,
        end_date=end_date,
        preferences=preferences,
    )
    provider = _get_provider(route_name, city)
    raw_result = provider.generate(
        system_prompt=system_prompt,
        history=history,
        user_message=user_text,
    )

    structured: dict[str, Any] | None = None
    if raw_result and raw_result.strip():
        structured = _parse_structured_output(raw_result, city)
        if structured is None:
            logger.warning("Model response is not valid structured JSON, using normalized fallback")
            structured = _fallback_structured(route_name, city, user_text)
            structured["summary"] = [raw_result.strip()[:220]]
    else:
        logger.warning(
            "Using fallback assistant reply for route='%s', city='%s', provider='%s'",
            route_name,
            city,
            os.getenv("AI_PROVIDER", "ollama"),
        )
        structured = _fallback_structured(route_name, city, user_text)

    return {
        "text": _render_structured_text(structured),
        "structured": structured,
    }


def generate_trip_assistant_reply(
    route_name: str,
    city: str,
    start_date: str,
    end_date: str,
    preferences: str,
    history: list[dict[str, str]],
    user_text: str,
) -> str:
    result = generate_trip_assistant_output(
        route_name=route_name,
        city=city,
        start_date=start_date,
        end_date=end_date,
        preferences=preferences,
        history=history,
        user_text=user_text,
    )
    text = result.get("text")
    if isinstance(text, str) and text.strip():
        return text.strip()
    return _fallback_reply(route_name, city, user_text)
