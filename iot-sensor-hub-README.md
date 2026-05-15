# iot-sensor-hub

A boilerplate for ingesting, storing and streaming IoT sensor readings in real time.

Drop this in front of any sensor or device that outputs numeric values — it handles storage (Redis) and live broadcasting (SSE) out of the box. Supports multiple sensors via `sensor_id`.

---

## How it works

1. A device or producer sends a numeric reading via `POST /sensors/reading`
2. The reading is stored in Redis under a per-sensor key
3. All connected SSE consumers receive the update instantly via `GET /sensors/stream`
4. Any client can also poll the latest reading for a specific sensor via `GET /sensors/reading`

---

## Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/sensors/reading` | Store a new reading and broadcast to SSE consumers |
| `GET` | `/sensors/reading` | Return the latest reading for a sensor |
| `GET` | `/sensors/stream` | SSE stream — receive readings in real time |

All routes require the `x-api-key` header (or `?apiKey=` query param).

**POST /sensors/reading — request body:**

```json
{
  "sensor_id": "temperature-01",
  "value": 23.4
}
```

`sensor_id` is optional and defaults to `"default"`.

**Response:**

```json
{
  "ok": true,
  "reading": {
    "sensor_id": "temperature-01",
    "value": 23.4,
    "timestamp": "2025-05-02T14:00:00.000Z"
  }
}
```

**GET /sensors/reading?sensor_id=temperature-01 — response:**

```json
{
  "sensor_id": "temperature-01",
  "value": 23.4,
  "timestamp": "2025-05-02T14:00:00.000Z"
}
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env-example .env
```

Edit `.env`:

```env
API_KEY=your_secret_key
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
```

### 3. Start Redis

```bash
redis-server
```

### 4. Start the server

```bash
node server.js
```

---

## Authentication

Every request must include an API key:

```bash
# Via header
curl -H "x-api-key: your_secret_key" \
  "http://localhost:3000/sensors/reading?sensor_id=temperature-01"

# Via query param
curl "http://localhost:3000/sensors/reading?sensor_id=temperature-01&apiKey=your_secret_key"
```

---

## SSE Example

```javascript
const source = new EventSource(
  "http://localhost:3000/sensors/stream?apiKey=your_secret_key"
);

source.onmessage = (event) => {
  const { sensor_id, value, timestamp } = JSON.parse(event.data);
  console.log(sensor_id, value, timestamp);
};
```

---

## Adapting to your sensor

The only required field is `value` (numeric). You can extend the `reading` object in `server.js` to include any additional metadata your sensor provides — unit, location, device firmware version, etc.

```json
{
  "sensor_id": "humidity-02",
  "value": 68.1,
  "unit": "%",
  "location": "warehouse-b"
}
```

---

## Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Storage:** Redis (ioredis)
- **Streaming:** Server-Sent Events (SSE)

---

## License

MIT
