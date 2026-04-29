import httpx
import pytest

from conftest import auth_header, register_user_async


@pytest.mark.anyio
async def test_get_profile_returns_defaults(client: httpx.AsyncClient) -> None:
    created = await register_user_async(client)
    token = created["token"]

    response = await client.get("/api/profile", headers=auth_header(token))
    assert response.status_code == 200
    payload = response.json()

    assert payload["preferences"] == []
    assert payload["budget"] in {"средний", "эконом", "люкс"}
    assert len(payload["travel_style"]) >= 1


@pytest.mark.anyio
async def test_update_profile_persists_data(client: httpx.AsyncClient) -> None:
    created = await register_user_async(client)
    token = created["token"]

    update = await client.put(
        "/api/profile",
        headers=auth_header(token),
        json={
            "preferences": ["музеи", "парки", "кафе"],
            "budget": "люкс",
            "travel_style": ["культурный", "активный"],
        },
    )
    assert update.status_code == 200
    payload = update.json()
    assert payload["preferences"] == ["музеи", "парки", "кафе"]
    assert payload["budget"] == "люкс"
    assert payload["travel_style"] == ["культурный", "активный"]
