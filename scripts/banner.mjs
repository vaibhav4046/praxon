// Praxon hero banner — for GitHub social preview + LinkedIn Featured
import { chromium } from "playwright";
import fs from "node:fs/promises";

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  width: 1920px; height: 1005px;
  background:
    radial-gradient(ellipse at 70% 30%, #312e81 0%, #0a0a0a 55%);
  font-family: "Inter", -apple-system, "Helvetica Neue", Arial, sans-serif;
  color: white; overflow: hidden; position: relative;
}
.matrix {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(168,85,247,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(168,85,247,0.07) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 60% 60% at 70% 50%, black 30%, transparent 80%);
}
.glow1 { position: absolute; top: -160px; right: -80px; width: 720px; height: 720px;
  background: radial-gradient(circle, #a855f7 0%, transparent 70%); opacity: .35; filter: blur(70px); }
.glow2 { position: absolute; bottom: -200px; left: -100px; width: 600px; height: 600px;
  background: radial-gradient(circle, #ec4899 0%, transparent 70%); opacity: .25; filter: blur(80px); }
.container { position: relative; z-index: 10; padding: 96px 120px;
  display: flex; align-items: center; height: 100%; gap: 80px; }
.left { flex: 1; }
.brand { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.logo {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 36px; letter-spacing: -0.04em;
  box-shadow: 0 8px 32px rgba(168,85,247,0.5);
}
.brand-name { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
.brand-tag { font-size: 14px; color: #a78bfa; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }
h1 {
  font-size: 84px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; margin-bottom: 28px;
  background: linear-gradient(90deg, #fff 0%, #cbd5e1 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
h1 .accent {
  background: linear-gradient(90deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.subtitle { font-size: 26px; color: #c4b5fd; line-height: 1.45; margin-bottom: 44px; max-width: 720px; font-weight: 400; }
.subtitle b { color: #fff; font-weight: 600; }
.features { display: flex; gap: 14px; margin-bottom: 48px; flex-wrap: wrap; }
.chip { padding: 10px 18px; border: 1px solid rgba(168,85,247,0.4); border-radius: 999px;
  font-size: 15px; color: #e9d5ff; background: rgba(168,85,247,0.08); font-weight: 500; }
.cta { display: inline-flex; align-items: center; gap: 12px;
  padding: 18px 32px; border-radius: 12px; font-size: 18px; font-weight: 600;
  background: linear-gradient(90deg, #a855f7, #ec4899); color: white; text-decoration: none;
  box-shadow: 0 12px 32px rgba(168,85,247,0.4); }
.right { flex: 0 0 640px; position: relative; }
.window { background: #0f0f1a; border-radius: 16px;
  box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.18);
  overflow: hidden; transform: rotate(-2deg); }
.bar { height: 36px; background: #1a1a2e; display: flex; align-items: center; padding: 0 16px; gap: 8px; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.r{background:#ff5f56}.y{background:#ffbd2e}.g{background:#27c93f}
.title { color:#666; font-size: 12px; margin-left: 14px; font-family: "JetBrains Mono", monospace; }
.body { padding: 24px 26px; font-family: "JetBrains Mono", "SF Mono", Consolas, monospace;
  font-size: 13px; line-height: 1.85; }
.you { color: #c084fc; font-weight: 600; margin-bottom: 6px; }
.msg { color: #d1d5db; margin-bottom: 18px; }
.assistant { color: #f0abfc; font-weight: 600; margin-bottom: 6px; }
.tool { color: #6b7280; font-size: 12px; padding: 8px 12px; background: #1a1a2e;
  border-radius: 6px; margin-bottom: 8px; border-left: 2px solid #a855f7; }
.tool b { color: #a78bfa; }
</style></head><body>
<div class="matrix"></div>
<div class="glow1"></div>
<div class="glow2"></div>
<div class="container">
  <div class="left">
    <div class="brand">
      <div class="logo">P</div>
      <div>
        <div class="brand-name">praxon</div>
        <div class="brand-tag">open-source AI agent platform</div>
      </div>
    </div>
    <h1>Claude Cowork,<br>but <span class="accent">free &amp; open</span>.</h1>
    <p class="subtitle">Multi-provider AI agent platform. <b>Free LLMs.</b> Local-first. Cloud-deployable on Vercel + Supabase. Bring your own keys; ship agents in minutes.</p>
    <div class="features">
      <div class="chip">🧠 Multi-LLM router</div>
      <div class="chip">🛠 MCP-native</div>
      <div class="chip">🔌 Tool use · Web · Code</div>
      <div class="chip">☁️ Vercel + Supabase</div>
    </div>
    <div class="cta">github.com/vaibhav4046/praxon →</div>
  </div>
  <div class="right">
    <div class="window">
      <div class="bar"><div class="dot r"></div><div class="dot y"></div><div class="dot g"></div><div class="title">praxon — agent run</div></div>
      <div class="body">
<div class="you">You</div>
<div class="msg">Find top 5 React tools shipped this week. Compile into Notion page.</div>
<div class="tool"><b>tool</b> · web_search · "react tools 2026 weekly"</div>
<div class="tool"><b>tool</b> · web_fetch · 5 URLs</div>
<div class="tool"><b>tool</b> · notion_create_page · "React Tools Weekly"</div>
<div class="assistant">Praxon</div>
<div class="msg">Done. <span style="color:#a78bfa">Page created</span> with 5 tools, descriptions, and links. Posted to your Notion workspace.</div>
      </div>
    </div>
  </div>
</div>
</body></html>`;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1920, height: 1005 });
await page.setContent(html, { waitUntil: "domcontentloaded" });
await fs.mkdir("docs", { recursive: true });
await page.screenshot({ path: "docs/banner.png" });
await page.setViewportSize({ width: 1200, height: 627 });
await page.screenshot({ path: "docs/banner-li.png" });
await browser.close();
console.log("✓ docs/banner.png (1920x1005)");
console.log("✓ docs/banner-li.png (1200x627)");
