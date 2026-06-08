import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { CHECKLIST_DEF } from "@/lib/domain/constants";
import { calcMetrics, calcAdherence, calcRoutineScore } from "@/lib/domain/metrics";
import { fmt$, fmtDate } from "@/lib/domain/format";
import type { FlatTrade } from "@/components/journal-view";

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { ft }: { ft: FlatTrade } = await req.json();
    const t = ft.trade;
    const m = calcMetrics(t);
    const adherence = calcAdherence(t);
    const isWin = t.outcome === "Win" || t.outcome === "Target hit";

    const html = buildPdfHtml(ft, m, adherence, isWin);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Trade-${t.instrument}-${t.occurredAt.slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "PDF generation failed" },
      { status: 500 },
    );
  } finally {
    if (browser) await browser.close();
  }
}

function buildPdfHtml(
  ft: FlatTrade,
  m: ReturnType<typeof calcMetrics>,
  adherence: number,
  isWin: boolean,
) {
  const t = ft.trade;
  const pnlColor = m.pnl >= 0 ? "#059669" : "#e11d48";

  const section = (title: string, content: string) => `
    <div style="margin-bottom:14px; page-break-inside:avoid;">
      <h2 style="font-size:13px; font-weight:700; margin:0 0 8px 0; color:#111; border-bottom:1px solid #ddd; padding-bottom:4px;">${title}</h2>
      ${content}
    </div>
  `;

  const box = (label: string, value: string, color?: string) => `
    <div style="border:1px solid #ddd; border-radius:6px; padding:8px; background:#fafafa;">
      <div style="font-size:9px; font-weight:600; text-transform:uppercase; color:#666; letter-spacing:0.5px;">${label}</div>
      <div style="font-size:15px; font-weight:700; margin-top:2px; ${color ? `color:${color};` : "color:#111;"}">${value}</div>
    </div>
  `;

  const badge = (text: string, bg: string, color: string) => `
    <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; background:${bg}; color:${color};">${text}</span>
  `;

  const rows = (title: string, items: { left: string; right: string }[]) => `
    <div style="border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:8px;">
      <div style="font-size:9px; font-weight:700; text-transform:uppercase; color:#666; letter-spacing:0.5px; margin-bottom:6px;">${title}</div>
      ${items.map((i) => `<div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:3px;"><span style="color:#555;">${i.left}</span><span style="font-weight:600; font-family:monospace;">${i.right}</span></div>`).join("")}
    </div>
  `;

  const images = [];
  if (t.htfUrl) {
    images.push(`
      <div style="border:1px solid #ddd; border-radius:6px; overflow:hidden;">
        <div style="background:#f3f4f6; padding:4px 8px; font-size:9px; font-weight:700; text-transform:uppercase; color:#666;">HTF</div>
        <img src="${t.htfUrl}" style="width:100%; max-height:260px; object-fit:contain; display:block;" />
      </div>
    `);
  }
  if (t.ltfUrl) {
    images.push(`
      <div style="border:1px solid #ddd; border-radius:6px; overflow:hidden;">
        <div style="background:#f3f4f6; padding:4px 8px; font-size:9px; font-weight:700; text-transform:uppercase; color:#666;">LTF</div>
        <img src="${t.ltfUrl}" style="width:100%; max-height:260px; object-fit:contain; display:block;" />
      </div>
    `);
  }

  const checklistHtml = CHECKLIST_DEF.map((item) => {
    const v = t.checklist[item.key];
    const color = v === "Yes" ? "#059669" : v === "No" ? "#e11d48" : "#9ca3af";
    return `<div style="display:flex; justify-content:space-between; font-size:12px; padding:3px 0; border-bottom:1px solid #f0f0f0;"><span>${item.label}</span><span style="font-weight:700; color:${color};">${v}</span></div>`;
  }).join("");

  const setupRows = [
    { left: "Primary Setup", right: t.setup.primary || "—" },
    { left: "HTF Bias", right: `${t.setup.htfBias} on ${t.setup.htfTimeframe}` },
    { left: "Entry Module", right: t.setup.entryModel },
    { left: "Took Liquidity Before Entry", right: t.setup.tookLiquidityBeforeEntry || "No" },
  ];

  const psychologyBoxes = [
    { label: "Setup Plan Level", value: t.psychology.setupPlanLevel },
    { label: "Emotional State", value: t.executionReview.emotionalState ?? "—" },
    { label: "Waited for Setup", value: t.psychology.waitedForSetup },
    { label: "Moved Stop", value: t.psychology.movedStop },
    { label: "Exited Early", value: t.psychology.exitedEarly },
    ...(t.psychology.exitedEarly === "Yes" ? [{ label: "Why Exited Early", value: t.psychology.exitedEarlyWhy }] : []),
  ];

  let routineHtml = "<p style=\"font-size:12px; color:#666;\">No routine logged for this session.</p>";
  if (ft.routine) {
    const r = ft.routine;
    const score = calcRoutineScore(r);
    const disc = ["meditation", "workout", "tradeJournal"] as const;
    const pre = ["meditation5min", "htfAnalysis", "markLevels", "tradePlan", "newsCheck"] as const;
    routineHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:8px;">
        <span style="font-size:12px; font-weight:500;">Routine Score</span>
        <span style="font-size:20px; font-weight:800; color:${score >= 80 ? "#059669" : "#d97706"};">${score}%</span>
      </div>
      <div style="border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:8px;">
        <div style="font-size:9px; font-weight:700; text-transform:uppercase; color:#666; margin-bottom:6px;">Discipline</div>
        <div style="display:flex; flex-wrap:wrap; gap:4px;">
          ${disc.map((k) => `<span style="padding:2px 8px; border-radius:4px; font-size:10px; border:1px solid #ddd; background:${r.discipline[k] ? "#111" : "transparent"}; color:${r.discipline[k] ? "#fff" : "#333"};">${k === "tradeJournal" ? "Journal" : k.charAt(0).toUpperCase() + k.slice(1)}</span>`).join("")}
        </div>
      </div>
      <div style="border:1px solid #ddd; border-radius:6px; padding:10px; margin-bottom:8px;">
        <div style="font-size:9px; font-weight:700; text-transform:uppercase; color:#666; margin-bottom:6px;">Pre-Market</div>
        <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:6px;">
          ${pre.map((k) => `<span style="padding:2px 8px; border-radius:4px; font-size:10px; border:1px solid #ddd; background:${r.preMarket[k] ? "#111" : "transparent"}; color:${r.preMarket[k] ? "#fff" : "#333"};">${k.replace(/([A-Z])/g, " $1").trim()}</span>`).join("")}
        </div>
        ${r.preMarket.stateOfMind ? `<div style="margin-top:6px;"><div style="font-size:9px; text-transform:uppercase; color:#666;">State of Mind</div><div style="font-size:12px;">${r.preMarket.stateOfMind}</div></div>` : ""}
        ${r.preMarket.preMarketNotes ? `<div style="margin-top:6px;"><div style="font-size:9px; text-transform:uppercase; color:#666;">Market Context & Trade Plan</div><div style="font-size:12px;">${r.preMarket.preMarketNotes}</div></div>` : ""}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { margin: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #111; background: #fff; line-height: 1.4; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div style="padding: 4px;">
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; padding-bottom:10px; border-bottom:2px solid #eee;">
      <div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
          <h1 style="font-size:22px; font-weight:800; margin:0; letter-spacing:-0.5px;">${t.instrument}</h1>
          ${badge(t.direction, t.direction === "Long" ? "#d1fae5" : "#fee2e2", t.direction === "Long" ? "#059669" : "#e11d48")}
          ${badge(t.outcome, isWin ? "#d1fae5" : t.outcome === "Loss" ? "#fee2e2" : "#fef3c7", isWin ? "#059669" : t.outcome === "Loss" ? "#e11d48" : "#d97706")}
        </div>
        <div style="font-size:11px; color:#666;">${fmtDate(t.occurredAt)} · ${t.sessionWindow} · Session: ${ft.sessionDate}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:26px; font-weight:800; letter-spacing:-1px; color:${pnlColor};">${fmt$(m.pnl)}</div>
        <div style="font-size:11px; color:#666;">${m.rr}:1 RR · ${m.rt} Risk Ticks · ${adherence}% Adherence</div>
      </div>
    </div>

    <!-- Stats -->
    <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:6px; margin-bottom:12px;">
      ${box("R (risk ticks)", String(m.rt))}
      ${box("Reward ticks", String(m.rwt))}
      ${box("R:R", `${m.rr}:1`)}
      ${box("P&L", fmt$(m.pnl), pnlColor)}
      ${box("Adherence", `${adherence}%`, adherence >= 80 ? "#059669" : adherence < 50 ? "#e11d48" : "#d97706")}
    </div>

    <!-- Trade Meta -->
    ${section("Trade Meta", `
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px;">
        ${box("Instrument", t.instrument)}
        ${box("Direction", t.direction)}
        ${box("Session", t.sessionWindow)}
      </div>
    `)}

    <!-- Entries / Exits -->
    ${section("Entries & Exits", `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        ${rows("Entry Legs", t.entries.map((en, i) => ({ left: en.time || `Entry ${i + 1}`, right: `${en.contracts} @ ${en.price || "—"}` })))}
        ${rows("Exit Legs", t.exits.map((ex, i) => ({ left: ex.time || `Exit ${i + 1}`, right: `${ex.contracts} @ ${ex.price || "—"}` })))}
      </div>
    `)}

    <!-- Risk & Outcome -->
    ${section("Risk & Outcome", `
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:6px;">
        ${box("Stop", String(t.stopPrice) || "—")}
        ${box("Target", String(t.targetPrice) || "—")}
        ${box("Contracts", String(t.contracts))}
        ${box("Outcome", t.outcome)}
      </div>
    `)}

    <!-- Setup -->
    ${section("Setup", `
      <div style="border:1px solid #ddd; border-radius:6px; padding:10px;">
        ${setupRows.map((r) => `<div style="display:flex; justify-content:space-between; font-size:12px; padding:4px 0; border-bottom:1px solid #f0f0f0;"><span style="color:#555;">${r.left}</span><span style="font-weight:600;">${r.right}</span></div>`).join("")}
      </div>
    `)}

    <!-- Checklist -->
    ${section("Pre-Trade Checklist", `
      <div style="border:1px solid #ddd; border-radius:6px; padding:10px;">
        ${checklistHtml}
      </div>
    `)}

    <!-- Psychology -->
    ${section("Execution & Psychology", `
      <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:6px; margin-bottom:8px;">
        ${psychologyBoxes.map((b) => box(b.label, b.value)).join("")}
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        <div style="border:1px solid #bbf7d0; background:#f0fdf4; border-radius:6px; padding:10px;">
          <div style="font-size:9px; font-weight:700; text-transform:uppercase; color:#166534; margin-bottom:4px;">What did I do right?</div>
          <div style="font-size:12px; color:#14532d; white-space:pre-wrap;">${t.psychology.whatDidIRight || "No notes."}</div>
        </div>
        <div style="border:1px solid #fecaca; background:#fef2f2; border-radius:6px; padding:10px;">
          <div style="font-size:9px; font-weight:700; text-transform:uppercase; color:#991b1b; margin-bottom:4px;">What did I do wrong?</div>
          <div style="font-size:12px; color:#7f1d1d; white-space:pre-wrap;">${t.psychology.whatDidIWrong || "No notes."}</div>
        </div>
      </div>
    `)}

    <!-- Screenshots -->
    ${images.length ? section("Screenshots", `
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
        ${images.join("")}
      </div>
    `) : ""}

    <!-- Routine -->
    ${section("Session Routine", routineHtml)}
  </div>
</body>
</html>`;
}
