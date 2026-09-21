# CodeVitals — Codebase Health & Web Performance Governance for TypeScript and JavaScript

**Ship a lighter, faster website — and keep it that way as your codebase grows.** CodeVitals is a zero-dependency CLI *and* a machine-readable skill for AI coding agents. It measures how heavy your code and your shipped JavaScript bundle are, tells you in plain language what that costs your users, and gets stricter automatically as your project scales.

[![Status: Phase 1](https://img.shields.io/badge/status-phase%201-orange)](#roadmap)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](#license)
[![Node](https://img.shields.io/badge/node-%E2%89%A524-brightgreen)](#quick-start)
[![Runtime dependencies: 0](https://img.shields.io/badge/runtime%20deps-0-success)](#zero-dependencies)

> **Status: Phase 1.** Source-code measurement and tier classification are shipping and tested. Bundle-weight analysis (the part that measures what your users actually download) is Phase 2. This README marks clearly what works today and what is planned — no vapourware.

---

## Why a heavy codebase costs you money

Every kilobyte of JavaScript your site sends is a kilobyte a phone on a 4G connection has to download, parse and execute before anyone sees anything useful.

That has a direct, measurable business cost:

- **Google ranks you on it.** Core Web Vitals — LCP, INP, CLS — are a confirmed Google ranking signal. Heavy initial JavaScript is the single most common cause of a slow LCP.
- **Users leave before the page loads.** Bounce rate climbs sharply with every extra second of load time; the traffic you paid to acquire never sees your product.
- **It gets worse silently.** Nobody ships a 900 KB bundle on purpose. It arrives one dependency at a time, and by the time it's a problem it's expensive to unwind.

CodeVitals exists to catch that drift while it's still cheap to fix — and to explain it in terms a non-engineer can act on.

> **The name is the thesis.** Google measures your *Web* Vitals — what users experience. CodeVitals measures the *code* that produces them, before you ship.

---

## What you get

**For developers**
Deterministic numbers — file counts, source lines, bundle bytes. Same input, same output, every run, every machine. No opinions, no heuristics, nothing to argue with in review.

**For product owners and founders**
A traffic-light health status and a plain-English recommendation. No jargon, no reading a config file to understand whether things are OK.

**For AI coding agents**
A deterministic, versioned JSON contract instead of guesswork. Agents like Claude Code, Cursor and Copilot can read your real measurements — tier, line counts, bundle bytes, findings — and act on evidence rather than inferring code health from whatever files happen to be in context. *(Ships in Phase 5; see [For AI coding agents](#for-ai-coding-agents).)*

**For your users**
Less JavaScript shipped, faster first paint, better Core Web Vitals, better search ranking.

---

## Quick start

**Requires Node.js 24+** (CodeVitals uses `node:util.parseArgs` from the standard library).

Not yet published to npm. From source:

```bash
git clone https://github.com/varun-kaklia/CodeVitals.git
cd CodeVitals/code
npm install
npm run build
node dist/cli.js --dir ../my-project
```

Once published:

```bash
npx codevitals
```

---

## What it looks like

```
========================================
 🛠️  CODEVITALS: DEVELOPER METRICS
========================================
• Classified Tier: SEED
• Files Analyzed:  15
• Physical Lines:  626
• Source Lines:    558 (Max: 15,000)
========================================

----------------------------------------
 📊 PRODUCT OWNER SUMMARY
----------------------------------------
Health Status: 🟢 Healthy (Early Stage)
Current Stage: Seed Tier
Recommendation: Codebase is lean and agile. Prioritize product
velocity; lightweight governance is sufficient.
----------------------------------------
```

One command, two reports. The engineer gets the numbers; the stakeholder gets the decision.

---

## Governance that grows with you

Most quality tools apply the same strictness on day one as on day one thousand. A 400-line prototype gets audited like a 400,000-line monolith, so teams either drown in warnings or switch the tool off.

CodeVitals classifies your project into a lifecycle tier and adjusts what it expects of you:

| Tier | Source lines | Initial JS budget | What CodeVitals does |
|------|--------------|-------------------|----------------------|
| 🟢 **Seed** | up to 15,000 | 250 KB | Observes. Stay fast, ship features. |
| 🟡 **Growth** | up to 50,000 | 500 KB | Warns clearly, suggests fixes. |
| 🟠 **Scale** | up to 150,000 | 1 MB | Proposes concrete remediation. |
| 🔴 **Enterprise** | beyond that | beyond that | Strict CI gatekeeper. |

Promotion uses **OR logic** — crossing *either* the line budget *or* the JavaScript budget moves you up a tier. A small codebase that ships a bloated bundle is still a performance problem, and CodeVitals treats it as one.

Every threshold above is a default you can change.

> Initial-JS budgets are configurable today; the measurement that fills them lands in Phase 2. Phase 1 classifies on source lines.

---

## Configuration

Drop a `codevitals.config.json` into the directory you're scanning:

```json
{
  "tiers": {
    "seed":   { "maxLoc": 8000, "maxInitialJsBytes": 204800 },
    "growth": { "maxLoc": 40000 }
  },
  "ignore": ["node_modules", "dist", "vendor", "generated"]
}
```

Anything you leave out keeps its default. **Config is validated, not trusted** — a wrong type is dropped and the default survives, rather than silently corrupting your results. A string `"15000"` where a number belongs, a `null`, or an `ignore` that isn't an array will not quietly break your thresholds. Your `ignore` entries are added to the built-in list, never replace it.

**Ignored by default:** `node_modules` · `.git` · `dist` · `build` · `coverage` · `.next` · `.cache` · `.turbo`
**Analyzed:** `.ts` · `.tsx` · `.js` · `.jsx` · `.mjs` · `.cjs`

### CLI

| Flag | Short | Description |
|------|-------|-------------|
| `--dir <path>` | `-d` | Directory to analyze (default: current) |
| `--help` | `-h` | Show usage |
| `--version` | `-v` | Show version |

A path can also be passed positionally.

---

## Zero dependencies

CodeVitals installs **nothing** at runtime. Directory walking is `node:fs`, argument parsing is `node:util`, tests run on `node:test`. TypeScript and `tsx` are dev-only and never reach a consumer's machine.

A tool that audits your bundle weight has no business adding to it.

---

## How it works

1. **Walk** — a `Dirent`-based recursive walk prunes ignored directories early and sorts entries, so output is identical across machines and CI.
2. **Count** — files are read sequentially to keep memory flat and avoid `EMFILE` on large repos. Line counting is POSIX-correct: a trailing newline terminates a line, it doesn't add one.
3. **Classify** — measurements are compared against tier budgets with OR logic.
4. **Report** — one analysis, formatted for two audiences.

Strictly layered: `reporters → core → config → types`. Pure static analysis — CodeVitals never writes to your source and never injects anything into your bundle.

---

## For AI coding agents

AI agents are good at writing code and bad at knowing whether a codebase is getting heavier. They see the files in their context window, not the shape of the whole repository — so "is this refactor making things worse?" is a question they currently answer by guessing.

CodeVitals is designed to be that missing sense. Point an agent at the CLI and it gets hard numbers instead of impressions:

- **Deterministic** — same input, same output, every run, every machine. Nothing for a model to hallucinate around; file ordering is sorted and number formatting is locale-pinned precisely so two runs can be diffed.
- **Versioned contract** — a stable `.codevitals.json` schema that agents can depend on without breaking when fields are added.
- **Actionable** — tier, thresholds, measurements and findings, structured for a machine to act on rather than a human to read.
- **Safe to run** — read-only static analysis with zero runtime dependencies. An agent invoking CodeVitals cannot modify your source or your bundle.

Intended shape of the contract:

```json
{
  "version": "1.0",
  "tier": "growth",
  "metrics": { "loc": 18420, "initialJsBytes": 312000, "healthScore": 74 },
  "findings": [],
  "summary": { "developer": "...", "productOwner": "..." }
}
```

> **Status:** the JSON contract and `--output json` land in Phase 5. Today the CLI is human-readable output only. The Phase 1 foundations it depends on — deterministic ordering, locale-independent formatting, validated config — are already in place, because an agent contract is only worth as much as the determinism underneath it.

---

## Roadmap

| Phase | What it adds | Why it matters commercially | Status |
|-------|--------------|------------------------------|--------|
| **1** | Source-code measurement, lifecycle tiers, config, dual reports | Establishes the baseline and the tier system | ✅ Shipping |
| **2** | Bundle weight & tree-shaking readiness from esbuild/Rollup/Vite metafiles | Measures what users actually download — the number that moves LCP and search ranking | Planned |
| **3** | Git-backed history and trend tracking | Catches regressions the week they land, not the quarter they hurt | Planned |
| **4** | AST import graph — circular dependencies, barrel bloat, oversized modules | Finds the structural causes of a heavy bundle, not just the symptom | Planned |
| **5** | Machine-readable `.codevitals.json` contract, JSON output, CI gate | Lets AI coding agents and CI act on the data automatically | Planned |

Phase 2 reads your bundler's existing metafile rather than running a build itself — faster, and it can't disagree with your real production output.

---

## FAQ

**How does this help my website rank higher on Google?**
Google uses Core Web Vitals as a ranking signal, and oversized initial JavaScript is the most common cause of poor LCP. CodeVitals measures the JavaScript you ship and flags it against a budget before it reaches production. It doesn't do keyword SEO — it addresses the technical performance half of ranking.

**How is this different from Lighthouse or PageSpeed Insights?**
Those audit a page after it's deployed and tell you that you have a problem. CodeVitals runs against your repository, in CI, before you ship — and points at the code responsible. They're complementary: Lighthouse for the symptom, CodeVitals for the cause.

**How is this different from ESLint?**
ESLint enforces rules inside individual files. CodeVitals measures the codebase as a whole and scales its strictness to your project's size. Different jobs; run both.

**How is this different from `cloc` or `wc -l`?**
Line counting is one input, not the product. CodeVitals turns measurements into a governance decision — what tier you're in and what that means. It's also POSIX-correct on trailing newlines, which naive `split("\n")` counters are not.

**Does it modify my code or my bundle?**
No. Read-only static analysis, zero runtime footprint.

**Can a non-developer use the output?**
That's what the Product Owner summary is for — traffic-light status and a plain-language recommendation, no engineering vocabulary.

**Does it run in CI?**
It runs in CI today. Exit-code gating and JSON output arrive in Phase 5.

**Can my AI coding agent use this?**
That's a primary design goal. Phase 5 ships a versioned `.codevitals.json` contract so agents such as Claude Code, Cursor or Copilot can read real measurements instead of inferring code health from whatever is in their context window. Today the CLI is human-readable output; an agent can still run it and parse the text, but the stable machine contract is Phase 5. See [For AI coding agents](#for-ai-coding-agents).

**Which languages?**
TypeScript and JavaScript, including JSX/TSX and both module formats.

---

## Contributing

Built phase by phase as a learning-first project. Issues and discussion: [github.com/varun-kaklia/CodeVitals/issues](https://github.com/varun-kaklia/CodeVitals/issues)

```bash
npm run typecheck   # tsc --noEmit
npm test            # node --test
npm run build       # emits dist/
```

## License

MIT © varun

---

<sub>**Keywords:** codebase governance, AI agent skill, AI code review, LLM tooling, machine-readable code metrics, web performance optimization, Core Web Vitals, LCP optimization, bundle size analyzer, JavaScript bundle size, tree shaking, page speed optimization, technical SEO, code health CLI, static analysis, lines of code counter, TypeScript code quality, technical debt tracking, code complexity, CI performance budget, AI agent code analysis, zero dependency CLI.</sub>
