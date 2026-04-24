import logging
import re
from collections.abc import Sequence
from difflib import SequenceMatcher
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..integrations.geocoding import resolve_place_coords

logger = logging.getLogger(__name__)


def format_assistant_text(raw_text: str) -> str:
    text = (raw_text or "").strip()
    if not text:
        return text
    for header in ("Короткий вывод:", "План/советы:", "Уточнить:"):
        text = text.replace(header, f"\n{header}\n")
    text = re.sub(r"\s+-\s+", "\n- ", text)
    text = re.sub(r"\s+(\d+\.\s)", r"\n\1", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_map_points_from_text(
    *,
    db: Session,
    city: str,
    assistant_text: str,
    structured_places: list[dict[str, Any]] | None = None,
    limit: int = 8,
) -> list[dict]:
    if not city:
        return []

    city = _normalize_city(city)
    city_locations = _load_city_locations(db, city)

    selected: list[models.Location] = []
    metadata: dict[int, dict[str, Any]] = {}

    if structured_places:
        for place in structured_places[:limit]:
            if not isinstance(place, dict):
                continue
            name = (place.get("name") or "").strip()
            if not name:
                continue

            loc = _match_location_by_name(city_locations, name)
            if loc is None:
                loc = _resolve_and_cache(
                    db=db,
                    city=city,
                    place=place,
                    city_locations=city_locations,
                )

            if loc is not None and loc not in selected:
                selected.append(loc)
                metadata[loc.id] = {
                    "day": place.get("day"),
                    "reason": place.get("reason"),
                }

            if len(selected) >= limit:
                break

    if len(selected) < limit:
        normalized_text = _normalize(assistant_text)
        city_locations = _load_city_locations(db, city)
        for loc in city_locations:
            if loc in selected:
                continue
            if _normalize(loc.name) in normalized_text:
                selected.append(loc)
                if len(selected) >= limit:
                    break

    if len(selected) < 3:
        normalized_text = _normalize(assistant_text)
        preferred = _guess_categories(normalized_text)
        if preferred:
            city_locations = _load_city_locations(db, city)
            for loc in city_locations:
                if loc in selected:
                    continue
                if loc.category.lower() in preferred:
                    selected.append(loc)
                    if len(selected) >= limit:
                        break

    if not selected:
        city_locations = _load_city_locations(db, city)
        selected = list(city_locations[: min(limit, 5)])

    output: list[dict] = []
    seen_ids: set[int] = set()
    for loc in selected:
        if loc.id in seen_ids:
            continue
        seen_ids.add(loc.id)
        meta = metadata.get(loc.id, {})
        day = meta.get("day")
        reason = meta.get("reason")
        output.append({
            "location_id": str(loc.id),
            "name": loc.name,
            "category": loc.category,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "day": day if isinstance(day, int) else None,
            "reason": reason if isinstance(reason, str) and reason.strip() else None,
            "source": "db",
        })

    return output[:limit]


def _load_city_locations(db: Session, city: str) -> list[models.Location]:
    return (
        db.query(models.Location)
        .filter(models.Location.city.ilike(city))
        .order_by(models.Location.rating.desc(), models.Location.id.asc())
        .all()
    )


def _resolve_and_cache(
    *,
    db: Session,
    city: str,
    place: dict[str, Any],
    city_locations: list[models.Location],
) -> models.Location | None:
    name = (place.get("name") or "").strip()
    if not name:
        return None

    city = _normalize_city(city)

    lat = place.get("latitude")
    lon = place.get("longitude")

    if not (_is_coord(lat) and _is_coord(lon)):
        coords = resolve_place_coords(city=city, place_name=name)
        if coords is None:
            logger.warning("Geocoding failed for %r in %r", name, city)
            return None
        lat, lon = coords

    if not (_is_coord(lat) and _is_coord(lon)):
        return None

    category = (place.get("category") or "other").strip().lower() or "other"

    try:
        loc = models.Location(
            name=name,
            city=city,
            category=category,
            latitude=float(lat),
            longitude=float(lon),
            price_level=1,
            rating=0.0,
            description=None,
        )
        db.add(loc)
        db.commit()
        db.refresh(loc)
        city_locations.append(loc)
        logger.info("Cached new location %r (%r) in DB id=%d", name, city, loc.id)
        return loc
    except Exception:
        db.rollback()
        logger.exception("Failed to cache location %r", name)
        return None


_CITY_ALIASES: dict[str, str] = {
    "москва": "Москва", "moscow": "Москва",
    "санкт-петербург": "Санкт-Петербург", "saint petersburg": "Санкт-Петербург", "spb": "Санкт-Петербург",
    "махачкала": "Махачкала",
    "сочи": "Сочи",
    "казань": "Казань",
    "екатеринбург": "Екатеринбург",
    "новосибирск": "Новосибирск",
    "краснодар": "Краснодар",
    "владивосток": "Владивосток",
}


def _normalize_city(city: str) -> str:
    return _CITY_ALIASES.get(city.strip().lower(), city.strip())


def _is_coord(value: Any) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _guess_categories(normalized_text: str) -> set[str]:
    categories: set[str] = set()
    if any(t in normalized_text for t in ("музей", "museum", "галере", "выставк")):
        categories.add("museum")
    if any(t in normalized_text for t in ("кафе", "еда", "ресторан", "cafe", "food", "coffee", "кофе")):
        categories.add("cafe")
    if any(t in normalized_text for t in ("парк", "прогул", "сад", "walk", "park", "garden")):
        categories.add("park")
    if any(t in normalized_text for t in ("театр", "theater", "theatre", "спектакл")):
        categories.add("theater")
    return categories


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Zа-яА-Я0-9 ]", " ", (value or "").lower())).strip()


def _match_location_by_name(
    locations: Sequence[models.Location],
    candidate_name: str,
) -> models.Location | None:
    target = _normalize(candidate_name)
    if not target:
        return None

    best: models.Location | None = None
    best_score = 0.0

    for loc in locations:
        name = _normalize(loc.name)
        if not name:
            continue
        if name == target:
            return loc

        score = SequenceMatcher(None, target, name).ratio()
        if target in name or name in target:
            score = max(score, 0.93)

        if score > best_score:
            best_score = score
            best = loc

    return best if best_score >= 0.62 else None
