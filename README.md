# Praxon

> Open-source AI agent platform. Free LLMs. Local-first. Cloud-deployable.

A free, self-hosted alternative to Claude Cowork / Claude Code / Perplexity Computer. Praxon runs on free LLM providers (Groq, Gemini, Cerebras, Together, OpenRouter, HuggingFace) or fully local with Ollama. No subscription. No vendor lock-in.

## Features

- **Chat with streaming** — across 8+ free LLM providers w/ automatic fallback
- **Tool-calling agent** — file r/w, shell exec, web search, HTTP, headless browser (Playwright)
- **Projects** — per-project workspace, memory, system prompt, skills
- **Code workspace** — Monaco editor + terminal + file tree, side-by-side w/ chat
- **Voice input** — browser-native SpeechRecognition (Chrome/Edge)
- **File uploads** — attach docs, images, anything
- **Skills** — reusable prompt + tool-whitelist combos
- **MCP servers** — connect any Model Context Protocol server (GitHub, Notion, Slack, etc.)
- **Scheduled tasks** — cron-driven background agents
- **Local-first** — SQLite + filesystem, no cloud required
- **Self-host or deploy** — Docker compose, Vercel, AWS

## Quick start

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env.local
# add at least one provider key to .env.local
pnpm dev
```

Open http://localhost:3000.

### Get a free API key (pick at least one)

- [Groq](https://console.groq.com/keys) — Llama 3.3 70B, very fast, generous free tier
- [Google AI Studio](https://aistudio.google.com/apikey) — Gemini 2.0 Flash, free
- [Cerebras](https://cloud.cerebras.ai) — fastest free inference
- [Together AI](https://api.together.xyz) — free tier on Llama 3.3 70B
- [OpenRouter](https://openrouter.ai/keys) — aggregator w/ many free models

Or run [Ollama](https://ollama.com) locally and set `OLLAMA_ENABLED=1` — fully offline, no key needed.

For web search: [Tavily](https://tavily.com) free 1000/mo.

## Docker

```bash
docker compose up
```

Mounts `~/.praxon` for persistent data.

## Cloud deploy

- **Vercel**: push to GitHub, import. Set env vars in dashboard.
- **AWS ECS / Fly.io / Render**: use the included `Dockerfile`.

## Architecture

```
app/                    Next.js 15 App Router
  api/
    chat/               streaming chat + tool calls (ai-sdk v4)
    projects/           CRUD
    sessions/           CRUD + message history
    skills/             custom skill defs
    tasks/              cron-scheduled prompts
    mcp/                MCP server registry
    workspace/[id]/     file tree, file r/w, exec
components/
  chat/                 message, composer (voice + uploads)
  code/                 file tree, Monaco, terminal
lib/
  llm/providers/        groq, cerebras, gemini, together, ollama, hf, openrouter, nvidia-nim
  llm/router.ts         availability detection + fallback
  agents/
    orchestrator.ts     ai-sdk streamText w/ tools + fallback
    tools/              fs, shell, web, browser, memory
  db/                   better-sqlite3 — projects, sessions, messages, skills, tasks, mcp
  mcp/                  MCP client + tool wrapping
  scheduler/            node-cron runner
```

## Status

26-hour MVP build. Production-ready core. Browser-use is Playwright (not full OS desktop control yet — coming).

## License

MIT.
