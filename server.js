require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Redis = require("ioredis");

const app = express();

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

app.use(cors());
app.use(express.json());

// Connected SSE consumers
const consumers = new Set();

// API Key authentication middleware
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"] || req.query.apiKey;
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// GET /sensors/stream — SSE stream, pushes readings to all connected consumers
app.get("/sensors/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  consumers.add(res);

  req.on("close", () => {
    consumers.delete(res);
  });
});

// POST /sensors/reading — stores a sensor reading in Redis and broadcasts via SSE
app.post("/sensors/reading", async (req, res) => {
  const { value, sensor_id } = req.body;

  if (value === undefined || value === null) {
    return res.status(400).json({ error: "Field 'value' is required" });
  }

  if (isNaN(Number(value))) {
    return res.status(400).json({ error: "Field 'value' must be numeric" });
  }

  const reading = {
    sensor_id: sensor_id || "default",
    value: Number(value),
    timestamp: new Date().toISOString(),
  };

  const redisKey = `sensor:${reading.sensor_id}:latest`;
  await redis.set(redisKey, JSON.stringify(reading));

  // Broadcast to all connected SSE consumers
  const data = `data: ${JSON.stringify(reading)}\n\n`;
  consumers.forEach((consumer) => consumer.write(data));

  return res.status(200).json({ ok: true, reading });
});

// GET /sensors/reading — returns the latest reading for a given sensor
app.get("/sensors/reading", async (req, res) => {
  const sensorId = req.query.sensor_id || "default";
  const redisKey = `sensor:${sensorId}:latest`;
  const raw = await redis.get(redisKey);

  if (!raw) {
    return res.status(404).json({ error: `No reading found for sensor '${sensorId}'` });
  }

  return res.status(200).json(JSON.parse(raw));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`iot-sensor-hub running on port ${PORT}`);
});
