import { z } from "zod";
import type { Browser, BrowserContext, Page } from "playwright";
import type { ToolDef, ToolContext } from "./types";
import { ToolError } from "./types";

let _browser: Browser | null = null;
const _contexts = new Map<string, { ctx: BrowserContext; page: Page }>();

async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;
  const { chromium } = await import("playwright");
  _browser = await chromium.launch({
    headless: process.env.PRAXON_BROWSER_HEADLESS !== "0",
  });
  return _browser;
}

async function getPage(ctx: ToolContext): Promise<Page> {
  const existing = _contexts.get(ctx.sessionId);
  if (existing) return existing.page;
  const b = await getBrowser();
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await c.newPage();
  _contexts.set(ctx.sessionId, { ctx: c, page: p });
  return p;
}

export const browserOpenTool: ToolDef = {
  name: "browser_open",
  description: "Navigate the headless browser to a URL. Returns page title and a short text snapshot.",
  category: "browser",
  parameters: z.object({ url: z.string().url(), waitUntil: z.enum(["load", "domcontentloaded", "networkidle"]).default("domcontentloaded") }),
  run: async (args, ctx) => {
    const page = await getPage(ctx);
    await page.goto(args.url, { waitUntil: args.waitUntil, timeout: 30_000 });
    const title = await page.title();
    const text = (await page.evaluate(() => document.body?.innerText ?? "")).slice(0, 4000);
    return { url: page.url(), title, text };
  },
};

export const browserClickTool: ToolDef = {
  name: "browser_click",
  description: "Click an element by CSS selector or text. Returns the new URL and title.",
  category: "browser",
  parameters: z.object({
    selector: z.string().optional(),
    text: z.string().optional(),
    timeoutMs: z.number().int().positive().max(15_000).default(5_000),
  }),
  run: async (args, ctx) => {
    const page = await getPage(ctx);
    if (!args.selector && !args.text) throw new ToolError("browser_click", "Provide selector or text");
    if (args.selector) await page.click(args.selector, { timeout: args.timeoutMs });
    else await page.getByText(args.text!).first().click({ timeout: args.timeoutMs });
    return { url: page.url(), title: await page.title() };
  },
};

export const browserTypeTool: ToolDef = {
  name: "browser_type",
  description: "Type text into a CSS selector. Optionally press Enter at end.",
  category: "browser",
  parameters: z.object({
    selector: z.string(),
    text: z.string(),
    pressEnter: z.boolean().default(false),
  }),
  run: async (args, ctx) => {
    const page = await getPage(ctx);
    await page.fill(args.selector, args.text);
    if (args.pressEnter) await page.keyboard.press("Enter");
    return { ok: true, url: page.url() };
  },
};

export const browserExtractTool: ToolDef = {
  name: "browser_extract",
  description: "Extract text content from elements matching a CSS selector. Returns up to 50 matches.",
  category: "browser",
  parameters: z.object({ selector: z.string(), max: z.number().int().min(1).max(200).default(50) }),
  run: async (args, ctx) => {
    const page = await getPage(ctx);
    const items = await page.$$eval(args.selector, (els, max) =>
      els.slice(0, max).map((e) => (e as HTMLElement).innerText.trim()),
    args.max);
    return { count: items.length, items };
  },
};

export const browserScreenshotTool: ToolDef = {
  name: "browser_screenshot",
  description: "Capture full-page screenshot. Returns a base64 PNG.",
  category: "browser",
  parameters: z.object({ fullPage: z.boolean().optional().default(true) }).passthrough(),
  run: async (args, ctx) => {
    const page = await getPage(ctx);
    const buf = await page.screenshot({ fullPage: args.fullPage ?? true, type: "png" });
    return { mime: "image/png", base64: buf.toString("base64") };
  },
};

export const browserCloseTool: ToolDef = {
  name: "browser_close",
  description: "Close the browser context for this session. Pass {} as args.",
  category: "browser",
  parameters: z.object({ _ignored: z.string().optional() }).passthrough(),
  run: async (_a, ctx) => {
    const c = _contexts.get(ctx.sessionId);
    if (c) {
      await c.ctx.close();
      _contexts.delete(ctx.sessionId);
    }
    return { closed: true };
  },
};

export const browserTools = [
  browserOpenTool, browserClickTool, browserTypeTool, browserExtractTool, browserScreenshotTool, browserCloseTool,
];
