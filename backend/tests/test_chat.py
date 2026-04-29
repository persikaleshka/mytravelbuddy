import httpx
import pytest

from app.api import chat as chat_api

from conftest import auth_header, register_user_async


async def _create_route(client: httpx.AsyncClient, token: str) -> str:
    response = await client.post(
        "/api/routes",
        headers=auth_header(token),
        json={
            "name": "Trip",
            "city": "Saint Petersburg",
            "start_date": "2026-04-20",
            "end_date": "2026-04-22",
            "items": [],
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["id"]


@pytest.mark.anyio
async def test_send_chat_message_and_get_history(
    client: httpx.AsyncClient,
    monkeypatch,
) -> None:
    created = await register_user_async(client)
    token = created["token"]
    route_id = await _create_route(client, token)

    def fake_assistant_output(**_kwargs):
        return {
            "text": "План готов.\n1) Эрмитаж\n2) Невский проспект",
            "structured": {
                "summary": ["Маршрут на 3 дня"],
                "plan": ["День 1: Эрмитаж", "День 2: Невский проспект"],
                "questions": [],
                "places": [
                    {
                        "name": "Эрмитаж",
                        "city": "Санкт-Петербург",
                        "latitude": None,
                        "longitude": None,
                        "day": 1,
                        "category": "museum",
                    }
                ],
            },
        }

    def fake_resolve_place_coords(**_kwargs):
        return 59.9398, 30.3146

    monkeypatch.setattr(chat_api, "generate_trip_assistant_output", fake_assistant_output)
    monkeypatch.setattr(chat_api, "resolve_place_coords", fake_resolve_place_coords)

    send_response = await client.post(
        f"/api/routes/{route_id}/messages",
        headers=auth_header(token),
        json={"text": "Хочу план на 3 дня"},
    )
    assert send_response.status_code == 200, send_response.text
    payload = send_response.json()

    assert payload["user_message"]["sender"] == "user"
    assert payload["assistant_message"]["sender"] == "assistant"
    assert payload["assistant_structured"]["places"][0]["name"] == "Эрмитаж"
    assert payload["assistant_structured"]["places"][0]["latitude"] == 59.9398
    assert payload["assistant_structured"]["places"][0]["longitude"] == 30.3146
    assert len(payload["map_points"]) == 1
    assert payload["map_points"][0]["name"] == "Эрмитаж"

    history = await client.get(
        f"/api/routes/{route_id}/messages",
        headers=auth_header(token),
    )
    assert history.status_code == 200
    messages = history.json()
    assert len(messages) == 2
    assert messages[0]["sender"] == "user"
    assert messages[1]["sender"] == "assistant"
