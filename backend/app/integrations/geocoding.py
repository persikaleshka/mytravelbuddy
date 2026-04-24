import logging
import os

logger = logging.getLogger(__name__)

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_USER_AGENT = os.getenv("NOMINATIM_USER_AGENT", "mytravelbuddy/1.0")

_CITY_TO_COUNTRYCODES: dict[str, str] = {
    "москва": "ru", "moscow": "ru",
    "санкт-петербург": "ru", "saint petersburg": "ru",
    "махачкала": "ru", "сочи": "ru", "казань": "ru",
    "екатеринбург": "ru", "новосибирск": "ru", "краснодар": "ru",
    "владивосток": "ru", "нижний новгород": "ru",
    "киев": "ua", "kyiv": "ua",
    "минск": "by", "minsk": "by",
    "алматы": "kz", "almaty": "kz",
    "берлин": "de", "berlin": "de",
    "париж": "fr", "paris": "fr",
    "рим": "it", "rome": "it",
    "барселона": "es", "barcelona": "es",
    "стамбул": "tr", "istanbul": "tr",
    "токио": "jp", "tokyo": "jp",
}


def resolve_place_coords(
    *,
    city: str,
    place_name: str,
    timeout_seconds: float | None = None,
) -> tuple[float, float] | None:
    place_name = place_name.strip()
    city = city.strip()
    if not place_name:
        return None

    timeout = timeout_seconds if timeout_seconds is not None else float(
        os.getenv("EXTERNAL_TIMEOUT_SECONDS", "20")
    )

    try:
        import httpx
    except ImportError:
        logger.error("httpx not installed — cannot geocode")
        return None

    city_key = city.lower()
    countrycodes = _CITY_TO_COUNTRYCODES.get(city_key)

    with httpx.Client(timeout=timeout) as client:
        result = _structured_search(client, place_name, city, countrycodes)
        if result is None:
            result = _freetext_search(client, place_name, city, countrycodes)

    return result


def _structured_search(
    client: "httpx.Client",
    place_name: str,
    city: str,
    countrycodes: str | None,
) -> tuple[float, float] | None:
    params: dict = {
        "amenity": place_name,
        "format": "json",
        "limit": 1,
        "accept-language": "ru",
    }
    if city:
        params["city"] = city
    if countrycodes:
        params["countrycodes"] = countrycodes

    try:
        resp = client.get(_NOMINATIM_URL, params=params, headers={"User-Agent": _USER_AGENT})
        resp.raise_for_status()
        results = resp.json()
    except Exception as exc:
        logger.warning("Nominatim structured search failed for %r: %s", place_name, exc)
        return None

    return _extract_coords(results, place_name)


def _freetext_search(
    client: "httpx.Client",
    place_name: str,
    city: str,
    countrycodes: str | None,
) -> tuple[float, float] | None:
    query = f"{place_name} {city}" if city else place_name
    params: dict = {
        "q": query,
        "format": "json",
        "limit": 1,
        "accept-language": "ru",
    }
    if countrycodes:
        params["countrycodes"] = countrycodes

    try:
        resp = client.get(_NOMINATIM_URL, params=params, headers={"User-Agent": _USER_AGENT})
        resp.raise_for_status()
        results = resp.json()
    except Exception as exc:
        logger.warning("Nominatim freetext search failed for %r: %s", query, exc)
        return None

    return _extract_coords(results, place_name)


def _extract_coords(results: list, place_name: str) -> tuple[float, float] | None:
    if not results:
        return None
    first = results[0]
    try:
        lat = float(first["lat"])
        lon = float(first["lon"])
        logger.info("Geocoded %r -> (%.4f, %.4f)", place_name, lat, lon)
        return lat, lon
    except (KeyError, ValueError, TypeError):
        return None
