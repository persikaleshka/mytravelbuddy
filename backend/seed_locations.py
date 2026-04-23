"""
Seed script: fills the locations table with real places.
Run from the backend/ directory:
    python seed_locations.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal
from app import models

LOCATIONS = [
    # ── Moscow ──────────────────────────────────────────────────────────
    dict(name="Третьяковская галерея", city="Moscow", category="museum",
         description="Крупнейший музей русского искусства", latitude=55.7414, longitude=37.6208,
         rating=4.9, price_level=2),
    dict(name="Красная площадь", city="Moscow", category="landmark",
         description="Главная площадь России", latitude=55.7539, longitude=37.6208,
         rating=4.9, price_level=1),
    dict(name="Кремль", city="Moscow", category="landmark",
         description="Московский Кремль — резиденция президента", latitude=55.7520, longitude=37.6175,
         rating=4.8, price_level=2),
    dict(name="Парк Горького", city="Moscow", category="park",
         description="Центральный парк культуры и отдыха", latitude=55.7297, longitude=37.6010,
         rating=4.7, price_level=1),
    dict(name="ВДНХ", city="Moscow", category="park",
         description="Выставка достижений народного хозяйства", latitude=55.8268, longitude=37.6375,
         rating=4.6, price_level=1),
    dict(name="Арбат", city="Moscow", category="landmark",
         description="Знаменитая пешеходная улица", latitude=55.7502, longitude=37.5963,
         rating=4.5, price_level=1),
    dict(name="Музей космонавтики", city="Moscow", category="museum",
         description="История освоения космоса", latitude=55.8228, longitude=37.6397,
         rating=4.7, price_level=2),
    dict(name="Большой театр", city="Moscow", category="theater",
         description="Главный оперный театр России", latitude=55.7601, longitude=37.6186,
         rating=4.8, price_level=3),
    dict(name="Коломенское", city="Moscow", category="park",
         description="Музей-заповедник с церковью Вознесения", latitude=55.6681, longitude=37.6693,
         rating=4.8, price_level=1),
    dict(name="Пушкинский музей", city="Moscow", category="museum",
         description="Музей изобразительных искусств", latitude=55.7448, longitude=37.6050,
         rating=4.7, price_level=2),
    dict(name="ГУМ", city="Moscow", category="shopping",
         description="Исторический торговый центр на Красной площади", latitude=55.7549, longitude=37.6218,
         rating=4.6, price_level=3),
    dict(name="Café Pushkin", city="Moscow", category="cafe",
         description="Знаменитое кафе в стиле русской классики", latitude=55.7644, longitude=37.6015,
         rating=4.6, price_level=3),
    dict(name="Зарядье", city="Moscow", category="park",
         description="Современный парк у Кремля с парящим мостом", latitude=55.7508, longitude=37.6271,
         rating=4.7, price_level=1),
    dict(name="Новодевичий монастырь", city="Moscow", category="landmark",
         description="Объект всемирного наследия ЮНЕСКО", latitude=55.7257, longitude=37.5568,
         rating=4.8, price_level=2),
    dict(name="Музей Москвы", city="Moscow", category="museum",
         description="История города от основания до наших дней", latitude=55.7356, longitude=37.6064,
         rating=4.5, price_level=2),

    # ── Махачкала ────────────────────────────────────────────────────────
    dict(name="Набережная Махачкалы", city="Махачкала", category="landmark",
         description="Главная набережная Каспийского моря", latitude=42.9849, longitude=47.5047,
         rating=4.4, price_level=1),
    dict(name="Джума-мечеть Махачкалы", city="Махачкала", category="landmark",
         description="Одна из крупнейших мечетей России", latitude=42.9833, longitude=47.5042,
         rating=4.7, price_level=1),
    dict(name="Национальный музей Дагестана", city="Махачкала", category="museum",
         description="История и культура народов Дагестана", latitude=42.9841, longitude=47.5027,
         rating=4.5, price_level=2),
    dict(name="Парк имени Ленинского комсомола", city="Махачкала", category="park",
         description="Центральный парк города", latitude=42.9887, longitude=47.4982,
         rating=4.2, price_level=1),
    dict(name="Каспийское побережье", city="Махачкала", category="park",
         description="Пляжи Каспийского моря", latitude=42.9700, longitude=47.5200,
         rating=4.5, price_level=1),
    dict(name="Центральный рынок Махачкалы", city="Махачкала", category="shopping",
         description="Традиционный дагестанский базар", latitude=42.9810, longitude=47.5030,
         rating=4.3, price_level=1),
]

# Normalise city variants so ilike queries match
CITY_ALIASES = {
    "moscow": "Moscow",
    "москва": "Moscow",
    "махачкала": "Махачкала",
}


def normalise_city(city: str) -> str:
    return CITY_ALIASES.get(city.lower().strip(), city.strip())


def seed():
    db = SessionLocal()
    try:
        existing_names = {loc.name for loc in db.query(models.Location.name).all()}
        added = 0
        for data in LOCATIONS:
            if data["name"] in existing_names:
                continue
            data["city"] = normalise_city(data["city"])
            loc = models.Location(**data)
            db.add(loc)
            added += 1
        db.commit()
        total = db.query(models.Location).count()
        print(f"Added {added} locations. Total in DB: {total}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
