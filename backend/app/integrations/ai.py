import os


def _fallback_reply(route_name: str, city: str, user_text: str) -> str:
    return (
        f"Принял запрос по поездке '{route_name}' ({city}). "
        f"Твой запрос: {user_text[:160]}. "
        "Могу предложить план по дням, подбор мест и порядок посещения."
    )


def generate_trip_assistant_reply(
    route_name: str,
    city: str,
    start_date: str,
    end_date: str,
    user_text: str,
) -> str:
    try:
        import httpx
    except Exception:
        return _fallback_reply(route_name, city, user_text)

    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    model = os.getenv("OLLAMA_MODEL", "llama3.1")
    timeout = float(os.getenv("EXTERNAL_TIMEOUT_SECONDS", "20"))

    prompt = (
        "Ты ассистент по путешествиям. Отвечай кратко и практично на русском языке. "
        "Учитывай контекст поездки.\n"
        f"Поездка: {route_name}\n"
        f"Город: {city}\n"
        f"Даты: {start_date} — {end_date}\n"
        f"Сообщение пользователя: {user_text}"
    )

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                f"{base_url.rstrip('/')}/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.4},
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return _fallback_reply(route_name, city, user_text)

    output_text = payload.get("response") if isinstance(payload, dict) else None
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    return _fallback_reply(route_name, city, user_text)
