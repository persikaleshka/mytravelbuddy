# MyTravelBuddy API Contract (v1)

## Base URL
- Local: http://127.0.0.1:8000
- API prefix: /api

## Content Type
- Request: Content-Type: application/json
- Response: application/json

## Auth
- Token type: Bearer JWT
- Header for protected endpoints:
  - Authorization: Bearer <token>
- Token is returned by:
  - POST /api/auth/register
  - POST /api/auth/login

## Error Format
- Current backend error body:
{
  "detail": "Error message"
}
---

## 1) Auth

### POST /api/auth/register
Create user and return auth token.

Request:
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Alena"
}
Success 200:
{
  "token": "<jwt>",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "Alena"
  }
}
Errors:
- 400 email already exists
- 422 validation error

### POST /api/auth/login
Login and return auth token.

Request:
{
  "email": "user@example.com",
  "password": "secret123"
}
Success 200:
{
  "token": "<jwt>",
  "user": {
    "id": "1",
    "email": "user@example.com",
    "name": "Alena"
  }
}
Errors:
- 401 invalid credentials
- 422 validation error

---

## 2) Locations

### GET /api/locations
Get locations list (public).

Query params:
- city (optional, substring filter)
- category (optional, exact filter)

Success 200:
[
  {
    "id": "1",
    "name": "Tretyakov Gallery",
    "description": "Museum",
    "city": "Moscow",
    "category": "museum",
    "latitude": 55.7414,
    "longitude": 37.6208,
    "imageUrl": null
  }
]
### POST /api/locations
Create location (public in current v1).

Request:
{
  "name": "Tretyakov Gallery",
  "description": "Museum",
  "city": "Moscow",
  "category": "museum",
  "latitude": 55.7414,
  "longitude": 37.6208,
  "price_level": 2,
  "rating": 4.8
}
Notes:
- price_level optional, default 1
- rating optional, default 0.0

Success 200:
{
  "id": "1",
  "name": "Tretyakov Gallery",
  "description": "Museum",
  "city": "Moscow",
  "category": "museum",
  "latitude": 55.7414,
  "longitude": 37.6208,
  "imageUrl": null
}
Errors:
- 422 validation error

---

## 3) Routes (Trips)

All routes endpoints below require Authorization: Bearer <token>.

### POST /api/routes
Create route.

Request:
{
  "name": "Weekend in Moscow",
  "city": "Moscow",
  "start_date": "2026-05-01",
  "end_date": "2026-05-03",
  "items": [
    {
      "location_id": 1,
      "day_number": 1,
      "order_in_day": 1
    },
    {
      "location_id": 2,
      "day_number": 1,
      "order_in_day": 2
    },
    {
      "location_id": 3,
      "day_number": 2,
      "order_in_day": 1
    }
  ]
}
Success 200:
{
  "id": "10",
  "name": "Weekend in Moscow",
  "city": "Moscow",
  "start_date": "2026-05-01",
  "end_date": "2026-05-03",
  "userId": "1",
  "createdAt": "2026-04-04T17:00:00.000000",
  "updatedAt": "2026-04-04T17:00:00.000000"
}
Errors:
- 400 start_date must be before or equal to end_date
- 401 invalid or missing token
- 422 validation error

### GET /api/routes
Get current user routes.

Success 200:
[
  {
    "id": "10",
    "name": "Weekend in Moscow",
    "city": "Moscow",
    "start_date": "2026-05-01",
    "end_date": "2026-05-03",
    "userId": "1",
    "createdAt": "2026-04-04T17:00:00.000000",
    "updatedAt": "2026-04-04T17:00:00.000000"
  }
]
Errors:
- 401 invalid or missing token

### GET /api/routes/{route_id}
Get one user route by id.

Path params:
- route_id integer

Success 200: same shape as route object above.

Errors:
- 401 invalid or missing token
- 404 route not found

### PUT /api/routes/{route_id}
Update route fields.

Request (any subset):
{
  "name": "Weekend updated",
  "city": "Moscow",
  "start_date": "2026-05-01",
  "end_date": "2026-05-04",
  "items": [
    {
      "location_id": 3,
      "day_number": 1,
      "order_in_day": 1
    },
    {
      "location_id": 2,
      "day_number": 1,
      "order_in_day": 2
    },
    {
      "location_id": 1,
      "day_number": 2,
      "order_in_day": 1
    }
  ]
}
Success 200: updated route object.

Errors:
- 400 start_date must be before or equal to end_date
- 401 invalid or missing token
- 404 route not found
- 422 validation error

### DELETE /api/routes/{route_id}
Delete route.

Success:
- 204 No Content

Errors:
- 401 invalid or missing token
- 404 route not found

---

## 4) Legacy UI Endpoints (Non-API)

These are server-rendered pages kept for compatibility:
- GET /auth/login
- GET /auth/register

They are not part of frontend SPA API contract.
---

## 5) Out of Scope for v1 (TBD)

Not implemented yet, should be added in next contract version:
- Profile API
- Chat/messages API
- Weather API integration
- Tickets API integration

## 6) Additional Route Endpoints

### GET /api/routes/{route_id}/page
Get complete route information including points, preferences, weather and tickets.

Success 200:
{
  "route": {
    "id": "10",
    "name": "Weekend in Moscow",
    "city": "Moscow",
    "start_date": "2026-05-01",
    "end_date": "2026-05-03",
    "userId": "1",
    "createdAt": "2026-04-04T17:00:00.000000",
    "updatedAt": "2026-04-04T17:00:00.000000"
  },
  "preferences": ["museum", "cafe"],
  "route_points": [
    {
      "location_id": "1",
      "name": "Tretyakov Gallery",
      "category": "museum",
      "latitude": 55.7414,
      "longitude": 37.6208,
      "day_number": 1,
      "order_in_day": 1
    }
  ],
  "weather": {
    "status": "not_configured",
    "message": "Weather integration is not configured yet"
  },
  "tickets": []
}