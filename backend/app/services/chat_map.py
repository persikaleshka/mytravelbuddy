import re
from collections.abc import Sequence
from difflib import SequenceMatcher
from typing import Any

from sqlalchemy.orm import Session

from .. import models
from ..integrations.geocoding import resolve_place_coords


def format_assistant_text(raw_text: str) -> str:
    text = (raw_text or "").strip()
    if not text:
        return text

    # Normalize section headers to improve readability in the chat UI.
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
    normalized_text = _normalize(assistant_text)
    if not city:
        return []

    city_locations: Sequence[models.Location] = (
        db.query(models.Location)
        .filter(models.Location.city.ilike(city))
        .order_by(models.Location.rating.desc(), models.Location.id.asc())
        .all()
    )
    if not city_locations:
        return []

    selected: list[models.Location] = []
    metadata_by_location_id: dict[int, dict[str, Any]] = {}
    output_external: list[dict] = []

    # 0) Prefer structured places from model JSON.
    if structured_places:
        for place in structured_places:
            if not isinstance(place, dict):
                continue
            raw_name = place.get("name")
            if not isinstance(raw_name, str) or not raw_name.strip():
                continue
            matched = _match_location_by_name(city_locations, raw_name)
            if matched is not None:
                if matched not in selected:
                    selected.append(matched)
                metadata_by_location_id[matched.id] = {
                    "day": place.get("day"),
                    "reason": place.get("reason"),
                }
            else:
                ext_point = _external_point_from_structured(place, city=city)
                if ext_point is not None:
                    output_external.append(ext_point)
            if len(selected) >= limit:
                break

    # 1) Direct name match: if assistant mentions a known location.
    if len(selected) < limit:
        for location in city_locations:
            if _normalize(location.name) in normalized_text and location not in selected:
                selected.append(location)
                if len(selected) >= limit:
                    break

    # 2) Category fallback: if no direct names, infer by user intent words.
    if not selected or len(selected) < min(limit, 3):
        preferred_categories = _guess_categories(normalized_text)
        if preferred_categories:
            for location in city_locations:
                if (
                    location.category.lower() in preferred_categories
                    and location not in selected
                ):
                    selected.append(location)
                    if len(selected) >= limit:
                        break

    # 3) Safety fallback: always return a few city points for map rendering.
    if not selected:
        selected = list(city_locations[: min(limit, 5)])

    dedup: dict[int, models.Location] = {}
    for item in selected:
        dedup[item.id] = item

    output: list[dict] = []
    for location in dedup.values():
        meta = metadata_by_location_id.get(location.id, {})
        day_value = meta.get("day")
        reason_value = meta.get("reason")
        output.append(
            {
                "location_id": str(location.id),
                "name": location.name,
                "category": location.category,
                "latitude": location.latitude,
                "longitude": location.longitude,
                "day": day_value if isinstance(day_value, int) else None,
                "reason": reason_value if isinstance(reason_value, str) else None,
                "source": "db",
            }
        )
    combined = output + output_external
    return combined[:limit]


def _guess_categories(normalized_text: str) -> set[str]:
    categories: set[str] = set()
    if any(token in normalized_text for token in ("музей", "museum", "галере")):
        categories.add("museum")
    if any(token in normalized_text for token in ("кафе", "еда", "ресторан", "cafe", "food")):
        categories.add("cafe")
    if any(token in normalized_text for token in ("парк", "прогул", "вид", "walk", "park", "view")):
        categories.add("park")
    return categories


def _normalize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Zа-яА-Я0-9 ]", " ", (value or "").lower())).strip()


def _external_point_from_structured(place: dict[str, Any], city: str) -> dict | None:
    raw_name = place.get("name")
    if not isinstance(raw_name, str) or not raw_name.strip():
        return None
    place_name = raw_name.strip()

    latitude = place.get("latitude")
    longitude = place.get("longitude")
    if not (isinstance(latitude, (int, float)) and isinstance(longitude, (int, float))):
        coords = resolve_place_coords(city=city, place_name=place_name)
        if not coords:
            return None
        latitude, longitude = coords

    category = place.get("category")
    if not isinstance(category, str) or not category.strip():
        category = "other"
    day = place.get("day")
    reason = place.get("reason")
    slug = _normalize(place_name).replace(" ", "_")[:40] or "place"

    return {
        "location_id": f"external:{slug}",
        "name": place_name,
        "category": category.strip().lower(),
        "latitude": float(latitude),
        "longitude": float(longitude),
        "day": day if isinstance(day, int) else None,
        "reason": reason.strip() if isinstance(reason, str) and reason.strip() else None,
        "source": "external",
    }


def _match_location_by_name(
    locations: Sequence[models.Location],
    candidate_name: str,
) -> models.Location | None:
    target = _normalize(candidate_name)
    if not target:
        return None

    best_location: models.Location | None = None
    best_score = 0.0
    for location in locations:
        name = _normalize(location.name)
        if not name:
            continue
        if name == target:
            return location

        score = SequenceMatcher(None, target, name).ratio()
        if target in name or name in target:
            score = max(score, 0.93)

        if score > best_score:
            best_score = score
            best_location = location

    if best_score >= 0.62:
        return best_location
    return None
