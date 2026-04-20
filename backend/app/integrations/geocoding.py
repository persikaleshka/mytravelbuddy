import os


def resolve_place_coords(
    *,
    city: str,
    place_name: str,
    timeout_seconds: float | None = None,
) -> tuple[float, float] | None:
    query = ", ".join([value for value in [place_name.strip(), city.strip()] if value])
    if not query:
        return None

    try:
        import httpx
    except Exception:
        return None

    timeout = timeout_seconds if timeout_seconds is not None else float(
        os.getenv("EXTERNAL_TIMEOUT_SECONDS", "20")
    )
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={
                    "name": query,
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
