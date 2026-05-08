# Deploying Praxon

Praxon is built to be deployed anywhere — your laptop, a VPS, Vercel, AWS, Fly.io, Render, or self-hosted on a Raspberry Pi.

## Quickest path: Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo.
3. Add env vars (at least one provider):
   - `GROQ_API_KEY` — recommended, fastest free tier
   - `GEMINI_API_KEY`
   - `TAVILY_API_KEY` — for Deep Research
4. Deploy.

> Note: Vercel serverless functions cap at 10s on Hobby, 60s on Pro. Praxon's Deep Research and Autonomous Agents may exceed these. For long-running workloads, use Docker/AWS/Fly.io instead.

## Docker (self-host)

```bash
cp .env.example .env
# add your keys to .env
docker compose up -d
```

Mounts `praxon-data` named volume. Persistent across restarts.

## Fly.io

```bash
fly launch --no-deploy
fly secrets set GROQ_API_KEY=... GEMINI_API_KEY=... TAVILY_API_KEY=...
fly deploy
```

The included `Dockerfile` works out of the box.

## AWS ECS / Fargate

1. Build + push:
   ```bash
   aws ecr create-repository --repository-name praxon
   docker build -t praxon .
   docker tag praxon:latest <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/praxon:latest
   docker push <ACCOUNT>.dkr.ecr.<REGION>.amazonaws.com/praxon:latest
   ```
2. Create an ECS service with:
   - Task memory: 1 GB minimum (Playwright Chromium)
   - Task CPU: 0.5 vCPU
   - EFS volume mounted at `/data` for persistence
   - Env vars from Secrets Manager

## Production hardening checklist

- [ ] Use a reverse proxy (Caddy, nginx, Traefik) for HTTPS
- [ ] Set `PRAXON_DATA_DIR` to a persistent volume
- [ ] Restrict Tavily/Groq keys to outbound IPs if possible
- [ ] Add a simple auth layer (Cloudflare Access, oauth2-proxy) if hosting publicly
- [ ] Monitor `/api/health` (returns mem usage + uptime)
- [ ] Backup `${PRAXON_DATA_DIR}/*.json` periodically (sessions, projects)
- [ ] Set `NODE_ENV=production`

## Scaling notes

- **Single-user mode** (current): one Node process holds in-memory tab/browser context for Playwright. Sessions are filesystem-backed.
- **Multi-user mode** (future): swap JSON store for Postgres, factor browser sessions per-user, use a shared LLM cache.
- **Horizontal scaling**: any number of stateless replicas — point all at the same data volume + Redis (planned) for browser session pinning.

## Free LLM provider quotas (rough)

| Provider | Free tier | Notes |
|---|---|---|
| Groq | ~14k req/day on Llama 3.3 70B | Fastest |
| Cerebras | 1M tokens/day | Insanely fast |
| Gemini | 15 RPM Flash | Generous |
| Together | $1 monthly credit | Llama 3.3 70B Turbo Free |
| OpenRouter | Some `:free` models | Aggregator |
| Ollama | Local | No quota |

Praxon auto-falls-back across configured providers when one rate-limits.
