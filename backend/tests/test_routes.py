import httpx
import pytest

from conftest import auth_header, register_user_async


async def _create_location(client: httpx.AsyncClient) -> str:
    response = await client.post(
        "/api/locations",
        json={
            "name": "Tretyakov Gallery",
            "description": "Museum",
            "city": "Moscow",
            "category": "museum",
            "latitude": 55.7414,
            "longitude": 37.6208,
            "price_level": 2,
            "rating": 4.7,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()["id"]


@pytest.mark.anyio
async def test_create_get_update_delete_route(client: httpx.AsyncClient) -> None:
    created = await register_user_async(client)
    token = created["token"]
    location_id = await _create_location(client)

    create_response = await client.post(
        "/api/routes",
        headers=auth_header(token),
        json={
            "name": "Weekend in Moscow",
            "city": "Moscow",
            "start_date": "2026-04-20",
            "end_date": "2026-04-22",
            "items": [
                {
                    "location_id": int(location_id),
                    "day_number": 1,
                    "order_in_day": 1,
                }
            ],
        },
    )
    assert create_response.status_code == 200, create_response.text
    route = create_response.json()
    route_id = route["id"]
    assert route["city"] == "Moscow"

    list_response = await client.get("/api/routes", headers=auth_header(token))
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    map_response = await client.get(
        f"/api/routes/{route_id}/map",
        headers=auth_header(token),
    )
    assert map_response.status_code == 200
    map_payload = map_response.json()
    assert map_payload["status"] == "ok"
    assert map_payload["city"] == "Moscow"
    assert len(map_payload["points"]) == 1

    update_response = await client.put(
        f"/api/routes/{route_id}",
        headers=auth_header(token),
        json={"name": "Updated route", "city": "Saint Petersburg"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Updated route"

    delete_response = await client.delete(
        f"/api/routes/{route_id}",
        headers=auth_header(token),
    )
    assert delete_response.status_code == 204

    after_delete = await client.get("/api/routes", headers=auth_header(token))
    assert after_delete.status_code == 200
    assert after_delete.json() == []
