# iot-sensor-hub

Boilerplate para ingestão, armazenamento e streaming de leituras de sensores IoT em tempo real.

Coloque isso na frente de qualquer sensor ou dispositivo que emita valores numéricos — o armazenamento (Redis) e a transmissão ao vivo (SSE) já estão prontos. Suporta múltiplos sensores via `sensor_id`.

---

## Como funciona

1. Um dispositivo ou produtor envia uma leitura numérica via `POST /sensors/reading`
2. A leitura é armazenada no Redis em uma chave por sensor
3. Todos os consumidores SSE conectados recebem a atualização instantaneamente via `GET /sensors/stream`
4. Qualquer cliente também pode consultar a última leitura de um sensor específico via `GET /sensors/reading`

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/sensors/reading` | Armazena uma nova leitura e transmite para os consumidores SSE |
| `GET` | `/sensors/reading` | Retorna a última leitura de um sensor |
| `GET` | `/sensors/stream` | Stream SSE — recebe leituras em tempo real |

Todas as rotas exigem o header `x-api-key` (ou o query param `?apiKey=`).

**POST /sensors/reading — corpo da requisição:**

```json
{
  "sensor_id": "temperature-01",
  "value": 23.4
}
```

`sensor_id` é opcional e usa `"default"` como valor padrão.

**Resposta:**

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

**GET /sensors/reading?sensor_id=temperature-01 — resposta:**

```json
{
  "sensor_id": "temperature-01",
  "value": 23.4,
  "timestamp": "2025-05-02T14:00:00.000Z"
}
```

---

## Setup

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

```bash
cp .env-example .env
```

Edite o `.env`:

```env
API_KEY=sua_chave_secreta
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
PORT=3000
```

### 3. Inicie o Redis

```bash
redis-server
```

### 4. Inicie o servidor

```bash
node server.js
```

---

## Autenticação

Toda requisição deve incluir uma API key:

```bash
# Via header
curl -H "x-api-key: sua_chave_secreta" \
  "http://localhost:3000/sensors/reading?sensor_id=temperature-01"

# Via query param
curl "http://localhost:3000/sensors/reading?sensor_id=temperature-01&apiKey=sua_chave_secreta"
```

---

## Exemplo SSE

```javascript
const source = new EventSource(
  "http://localhost:3000/sensors/stream?apiKey=sua_chave_secreta"
);

source.onmessage = (event) => {
  const { sensor_id, value, timestamp } = JSON.parse(event.data);
  console.log(sensor_id, value, timestamp);
};
```

---

## Adaptando para o seu sensor

O único campo obrigatório é `value` (numérico). Você pode estender o objeto `reading` em `server.js` para incluir qualquer metadado adicional do seu sensor — unidade, localização, versão de firmware, etc.

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
- **Armazenamento:** Redis (ioredis)
- **Streaming:** Server-Sent Events (SSE)

---

## Licença

MIT
