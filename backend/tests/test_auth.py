import httpx
import pytest

from conftest import register_user_async


@pytest.mark.anyio
async def test_register_and_login_success(client: httpx.AsyncClient) -> None:
    created = await register_user_async(client)
    assert created["user"]["email"] == "user@example.com"
    assert "token" in created and created["token"]

    response = await client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "secret123"},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["user"]["name"] == "User"
    assert payload["token"]


@pytest.mark.anyio
async def test_register_duplicate_email_returns_400(client: httpx.AsyncClient) -> None:
    await register_user_async(client)
    duplicate = await client.post(
        "/api/auth/register",
        json={
            "email": "user@example.com",
            "password": "anotherpass",
            "name": "Another",
        },
    )
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "Email already registered"
