import os
from typing import Any


def _degraded(message: str) -> dict[str, Any]:
    return {
        "status": "degraded",
        "source": "open-meteo",
        "message": message,
        "data": [],
    }


def _resolve_city_to_coords(city: str, timeout: float) -> tuple[float, float] | None:
    try:
        import httpx
    except Exception:
        return None

    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={
                    "name": city,
                    "count": 1,
                    "language": "ru",
                    "format": "json",
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return None

    results = payload.get("results") if isinstance(payload, dict) else None
    if not results:
        return None

    first = results[0]
    lat = first.get("latitude")
    lon = first.get("longitude")
    if isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
        return float(lat), float(lon)
    return None


def get_city_weather_forecast(
    city: str,
    start_date: str,
    end_date: str,
) -> dict[str, Any]:
    try:
        import httpx
    except Exception:
        return _degraded("Модуль httpx не установлен для weather-интеграции")

    timeout = float(os.getenv("EXTERNAL_TIMEOUT_SECONDS", "8"))
    coords = _resolve_city_to_coords(city, timeout)
    if not coords:
        return _degraded(f"Не удалось определить координаты для города '{city}'")

    latitude, longitude = coords
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "daily": "temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum",
                    "start_date": start_date,
                    "end_date": end_date,
                    "timezone": "auto",
                },
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return _degraded("Сервис погоды временно недоступен")

    daily = payload.get("daily") if isinstance(payload, dict) else None
    if not isinstance(daily, dict):
        return _degraded("Погодные данные недоступны")

    times = daily.get("time", [])
    t_max = daily.get("temperature_2m_max", [])
    t_min = daily.get("temperature_2m_min", [])
    w_codes = daily.get("weathercode", [])
    precip = daily.get("precipitation_sum", [])

    forecast = []
    for index, day in enumerate(times):
        forecast.append(
            {
                "date": day,
                "temp_max": t_max[index] if index < len(t_max) else None,
                "temp_min": t_min[index] if index < len(t_min) else None,
                "weather_code": w_codes[index] if index < len(w_codes) else None,
                "precipitation_sum": precip[index] if index < len(precip) else None,
            }
        )

    return {
        "status": "ok",
        "source": "open-meteo",
        "message": None,
        "data": forecast,
        "coords": {"latitude": latitude, "longitude": longitude},
    }
