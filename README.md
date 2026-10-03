# EcoGuard Environmental Dashboard

The dashboard reads current air quality and weather from Open-Meteo through a small Node API. Water and waste integrations stay unavailable until real provider endpoints are configured; no government endpoint is assumed.

## Run Locally

1. Install dependencies with `npm install`.
2. Copy `backend/.env.example` to the project-root `.env` and adjust the defaults if needed.
3. Start the API in one terminal with `npm run dev:api`.
4. Start Vite in another terminal with `npm run dev`.

Open `http://localhost:5173`. The API listens on `http://localhost:3001`.

Test the endpoint directly:

```text
GET http://localhost:3001/api/environment?latitude=28.9845&longitude=77.7064
```

If browser geolocation is allowed, the dashboard uses those coordinates. Otherwise, the API uses `DEFAULT_LATITUDE` and `DEFAULT_LONGITUDE` from `.env`.

## Configuration

- `OPEN_METEO_AIR_URL` and `OPEN_METEO_WEATHER_URL` configure the upstream Open-Meteo endpoints.
- `WATER_API_URL` and `WASTE_API_URL` are optional trusted server-side endpoints. Leave them blank until a real provider is selected. The water adapter accepts normalized metric names directly or inside a `data`/`result` object. The waste adapter expects percentage metrics in the range 0–100.
- `ENVIRONMENT_REFRESH_INTERVAL` configures the in-memory API cache TTL; `VITE_ENVIRONMENT_REFRESH_INTERVAL` configures the dashboard refresh interval. Both default to 300000 milliseconds.
- `DEFAULT_LATITUDE`/`DEFAULT_LONGITUDE` configure the server fallback; `VITE_DEFAULT_LATITUDE`/`VITE_DEFAULT_LONGITUDE` initialize the browser location and must match them.
- `API_TIMEOUT_MS` bounds each backend upstream request. `VITE_API_TIMEOUT_MS` bounds the browser request.
- `PORT` changes the API port. If changed, update the `/api` proxy target in `vite.config.js` as well.
- `CORS_ORIGINS` is a comma-separated allowlist for cross-origin API requests.

Waste score is calculated only when all four metrics are present: collection efficiency, segregation rate, processing rate, and open-dumping rate. It averages the first three with the inverse open-dumping rate; partial measurements do not produce a score.

## Checks

- `npm test` runs backend unit tests.
- `npm run lint` checks the project.
- `npm run build` creates the production frontend bundle.

For production, serve the frontend separately and route `/api` to the Node server, or configure the backend CORS allowlist for the frontend origin.