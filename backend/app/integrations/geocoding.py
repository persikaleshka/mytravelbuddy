import logging
import os

logger = logging.getLogger(__name__)

_NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
_USER_AGENT = os.getenv("NOMINATIM_USER_AGENT", "mytravelbuddy/1.0")

_CITY_BOUNDS: dict[str, tuple[float, float, float, float]] = {
    "краснодар":        (44.9, 38.8, 45.2, 39.2),
    "москва":           (55.4, 37.1, 56.0, 37.9),
    "moscow":           (55.4, 37.1, 56.0, 37.9),
    "санкт-петербург":  (59.7, 29.5, 60.2, 30.8),
    "saint petersburg": (59.7, 29.5, 60.2, 30.8),
    "казань":           (55.6, 48.8, 56.0, 49.4),
    "екатеринбург":     (56.6, 60.4, 56.9, 61.0),
    "новосибирск":      (54.7, 82.7, 55.2, 83.2),
    "сочи":             (43.4, 39.5, 43.8, 40.4),
    "махачкала":        (42.9, 47.4, 43.1, 47.7),
    "нижний новгород":  (56.1, 43.6, 56.5, 44.2),
    "владивосток":      (43.0, 131.8, 43.3, 132.1),
}

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
    if not place_name or not city:
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
    bounds = _CITY_BOUNDS.get(city_key)

    with httpx.Client(timeout=timeout) as client:
        result = _freetext_search(client, place_name, city, countrycodes, bounds)

    return result


def _freetext_search(
    client: "httpx.Client",
    place_name: str,
    city: str,
    countrycodes: str | None,
    bounds: tuple[float, float, float, float] | None,
) -> tuple[float, float] | None:
    query = f"{place_name}, {city}"
    params: dict = {
        "q": query,
        "format": "json",
        "limit": 5,
        "accept-language": "ru",
    }
    if countrycodes:
        params["countrycodes"] = countrycodes
    if bounds:
        lat_min, lon_min, lat_max, lon_max = bounds
        params["viewbox"] = f"{lon_min},{lat_max},{lon_max},{lat_min}"
        params["bounded"] = 1

    try:
        resp = client.get(_NOMINATIM_URL, params=params, headers={"User-Agent": _USER_AGENT})
        resp.raise_for_status()
        results = resp.json()
    except Exception as exc:
        logger.warning("Nominatim search failed for %r in %r: %s", place_name, city, exc)
        return None

    if not results:
        if bounds:
            return _freetext_search(client, place_name, city, countrycodes, None)
        return None

    coords = _extract_coords(results, place_name, bounds)
    if coords is None and bounds:
        coords = _extract_coords(results, place_name, None)
    return coords


def _extract_coords(
    results: list,
    place_name: str,
    bounds: tuple[float, float, float, float] | None,
) -> tuple[float, float] | None:
    for item in results:
        try:
            lat = float(item["lat"])
            lon = float(item["lon"])
        except (KeyError, ValueError, TypeError):
            continue

        if bounds:
            lat_min, lon_min, lat_max, lon_max = bounds
            if not (lat_min <= lat <= lat_max and lon_min <= lon <= lon_max):
                continue

        logger.info("Geocoded %r -> (%.5f, %.5f)", place_name, lat, lon)
        return lat, lon

    return None
