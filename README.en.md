<div align="center">

<a href="https://ashareapi.com/en/"><img src="https://ashareapi.com/icon-512.png" width="88" height="88" alt="ashareapi"></a>

# ashareapi — Official DeepSeek Harness Plugin for the A-Share Data API

Let **DeepSeek Harness (DSH)** query China A-share data directly: Quotes (intraday line · five-level depth) / K-lines / Financials / Money flow / Dragon-Tiger list / L2 order flow / Sectors / Factor screening / Quant backtest / short-term board plays / call auction / futures / forex / macro / watchlist / news & filings — **94 tools, and the free tools need no key**.

Works on the desktop app, the Web UI, and the command line — [download the desktop app](https://www.deepseek.com/harness/), open **Plugins**, and type a package name.

![Node.js](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4D6BFE)
[![npm](https://img.shields.io/npm/v/ashareapi-dsh-plugin?label=npm)](https://www.npmjs.com/package/ashareapi-dsh-plugin)
![License](https://img.shields.io/badge/license-MIT-green)

**Runs on the DeepSeek Harness desktop app and Web UI**:

![DeepSeek Harness desktop](https://img.shields.io/badge/DeepSeek%20Harness-Desktop-4D6BFE?logo=deepseek&logoColor=white)
![DeepSeek Harness Web UI](https://img.shields.io/badge/DeepSeek%20Harness-Web%20UI-4D6BFE?logo=deepseek&logoColor=white)

[中文](README.md) · **English**

[Website](https://ashareapi.com/en/) · [DSH plugin](https://ashareapi.com/en/dsh/) · [Docs](https://ashareapi.com/en/docs/) · [Endpoint list](https://ashareapi.com/en/endpoints/) · [MCP](https://ashareapi.com/en/mcp/) · [Agent Skill](https://ashareapi.com/en/skill/)

[Source](https://github.com/ashareapi/ashareapi-dsh-plugin) · [Issues](https://github.com/ashareapi/ashareapi-dsh-plugin/issues) · [Changelog](https://ashareapi.com/en/changelog/)

</div>

---

## What is this

An **A-share data DeepSeek Harness plugin**: once installed, asking DSH "what is 600667 trading at?" makes it call a tool and answer with **real market data** instead of guessing.

It works on the desktop app, the Web UI, and the command line — on the desktop app and the Web UI you just type a package name into **Plugins**; on the CLI it is one command.

Under the hood it connects to the **MCP service** at [ashareapi.com](https://ashareapi.com/en/) (a single URL). The plugin's only job is to wire that service into DSH — transport, tool registration, and reconnection are all handled by DSH's own MCP client, so a DSH upgrade rarely requires a change here.

---

## Why use it

- **94 tools, configured once**: quotes / K-lines / five-level depth / full-field profile / financials / money flow / Dragon-Tiger list / sectors / convertible bonds / ETFs / factor screening / quant backtests / anomaly deviation / call auction / futures / forex / macro / watchlist / news & filings — the mainstream surface of the A-share market
- **Install by package name, from the desktop app or Web UI**: no JSON to hand-edit, no script to run — restart and it is live
- **Free tools are genuinely key-free**: `ashare_quote` / `ashare_kline` / `ashare_hot` / `ashare_market_overview` / `ashare_changedist` / `ashare_wiki_search` work right after installation, no key purchase needed
- **Intraday data is never cached**: every call fetches fresh · `minute` gives 242 points for the day · `auction` covers 9:15–9:25 (about 150 points)
- **10 years of K-line history**: from 2016-08-08; `kline_full` returns all of it at once (about 2,500 bars, each starting at the stock's listing date); daily / weekly / monthly / quarterly / yearly plus `m1`–`m120`
- **Whole market in one call**: `market_kline` returns every A-share (5,000+) for one trading day — no 5,000-request loop
- **L2 microstructure, 7 tools**: market-wide net-flow ranking with **5,568 stocks in one call** · Dragon-Tiger seats down to **broker-branch level** · large-order four directions / order-queue add-cancel / 100-day large-order history
- **Batch tools, 9 of them**: quote / K-line / snapshot / financials / technical / chip / shareholders / money flow / company profile — **150 stocks in about 2 seconds**
- **One key, five markets**: A-shares + on-exchange ETFs (1,716) + Hong Kong + US + futures & forex (65 instruments)
- **Quant in one place**: 87 factors + 29 strategies + 25 playbooks + backtests (single / portfolio / batch) + portfolio weight optimisation
- **No charge when we fail**: empty results, upstream fetch failures, wrong codes — none of them are billed (billing counts actual returned rows only)
- **Diagnosable**: every response carries a `trace_id`; quote it in a support request and we can find that exact call
- **Automatic source failover**: 70 data sources back each other up on the backend; if one has a problem it switches to the next, and **your quota is not charged**
- **Fixed conventions, no post-processing**: K-lines are always **forward-adjusted (qfq)** (there is no `adjust` parameter), so there is no double-adjustment
- **No data ≠ failure**: "the market genuinely has no data" (e.g. a suspended stock) is returned separately from "the fetch failed" — the agent will not mistake a suspension for an outage
- **Tool descriptions written for AI Agents**: every tool states *when to use it / how to fill the parameters / what it returns*, so the agent does not call it wrong
- **One config, nothing to maintain**: source failover / caching / health checks all run server-side — install it and use it, and failures stay easy to diagnose

---

## Install

### Desktop app / Web UI (recommended)

[Download the DeepSeek Harness desktop app](https://www.deepseek.com/harness/) (macOS / Windows), open **Plugins** in the sidebar, and type the package name:

```
ashareapi-dsh-plugin
```

The Web UI (`dsh web`) has the same **Plugins** page. That's it — the tools are available in your next conversation. No command line, no config file.

### Command line

```bash
npx @deepseek-ai/dsh web                                    # start the Web UI
npx @deepseek-ai/dsh plugin --profile web add ashareapi-dsh-plugin
```

(If you already have `dsh` installed globally, drop the `npx @deepseek-ai/dsh` prefix.)

> Installing from the command line — and the Web UI's **Plugins** page — runs your local **pnpm** (DSH does not bundle it; the desktop app ships its own). If you don't have it: `npm i -g pnpm`.

Then **restart `dsh web`**. You can also confirm the layer is in place before starting:

```bash
npx @deepseek-ai/dsh --profile web --dump-config   # look for "# == ashareapi-dsh-plugin"
```

> ⚠️ The desktop app manages its own profile and **cannot be installed from the command line** — on desktop use the **Plugins** page above.

Then just ask:

| You ask | Tool used |
|---|---|
| What is 600667 trading at? | `ashare_quote` |
| Pull the last 60 daily candles for 600667 | `ashare_kline` |
| How is the market doing today? | `ashare_market_overview` |
| What are people watching right now? | `ashare_hot` |
| What is today's advance/decline distribution? | `ashare_changedist` |

Other ways to install (command line):

```bash
# From GitHub
npx @deepseek-ai/dsh plugin --profile web add github:ashareapi/ashareapi-dsh-plugin

# From a local directory (for development)
npx @deepseek-ai/dsh plugin --profile web add file:/absolute/path/to/ashareapi-dsh-plugin
```

> This plugin is plain JavaScript with **no build step**, so a GitHub install works immediately — no `allowBuilds` approval needed in pnpm.

Uninstall:

```bash
npx @deepseek-ai/dsh plugin --profile web remove ashareapi-dsh-plugin
```

---

## API key setup

The 6 free tools above work with **no configuration at all**.

To use the other 88 tools (order book / financials / money flow / dragon-tiger list / sectors / screening / macro / quant backtests / short-term board plays / futures / forex / news & filings …) you need a key: [get one here](https://ashareapi.com/en/pricing/). Trial starts at ¥9.9; **some tools need a higher tier** — quant backtests / factors / strategies are Pro (¥99), futures / forex are Institutional (¥199). Per-tool tiers are listed on the [pricing page](https://ashareapi.com/en/pricing/).

**Option 1: environment variable** (simplest)

Add one line to `~/.dsh/.env` (or wherever `$DSH_HOME` points):

```
ASHAREAPI_KEY=ct-your-key
```

**Option 2: in the profile**

Edit that profile's `cordis.patch.yml` — `~/.dsh/profiles/web/cordis.patch.yml` for the Web UI / CLI, or `~/.dsh/profiles/desktop/cordis.patch.yml` for the desktop app (its directory only appears after you open the desktop app once). Add an id-targeted override:

```yaml
- id: mcp-ashareapi
  name: ashareapi-dsh-plugin
  config:
    apiKey: ct-your-key
```

> ⚠️ This patch **replaces the entry's whole `config`**, so only list the fields you want to change — everything else (endpoint, namespace) falls back to the plugin's built-in defaults.

**Configurable fields**

| Field | Default | Meaning |
|---|---|---|
| `apiKey` | reads `ASHAREAPI_KEY` | Omit it to stay anonymous — only the 6 free tools work |
| `url` | `https://api.ashareapi.com/mcp` | Change this to go through your own proxy |
| `serverName` | `ashareapi` | Tool-name prefix, i.e. `mcp__ashareapi__*`; `[A-Za-z0-9_-]{1,32}` |
| `headers` | `{}` | Extra request headers, merged with the key above |

Every other field (`toolCallTimeoutMs`, `failOnStartupError`, …) is handled by DSH's own MCP client — use it exactly as the DSH docs describe.

---

## Tools

Registered tool names look like `mcp__ashareapi__ashare_quote`.

**Free (no key)**

`ashare_quote` live snapshot · `ashare_kline` candles · `ashare_hot` attention list · `ashare_changedist` market breadth · `ashare_market_overview` market overview · `ashare_wiki_search` doc search

> Free / anonymous tier is refreshed every **5 minutes** (to keep the service stable); paid tiers are real-time.

**Requires a key**

`ashare_orderbook` order book · `ashare_snapshot` full-field profile · `ashare_finance` financials · `ashare_fund` money flow · `ashare_technical` technical indicators · `ashare_shareholder` shareholders · `ashare_events` events · `ashare_lhb` dragon-tiger list · `ashare_screen` factor screening · `ashare_sector` sectors · `ashare_sector_valuation` sector valuation · `ashare_macro` macro · `ashare_bond` convertible bonds · `ashare_etf` ETFs · `ashare_ipo` IPOs · `ashare_dividend` dividends · `ashare_dehydrated` research digest · `ashare_search` symbol search · `ashare_usage` usage · `ashare_minute` intraday · `ashare_kline_full` full-history K-line · `ashare_backtest` quant backtest · `ashare_backtest_batch` batch backtest · `ashare_strategies` strategy list · `ashare_factors` factor library · `ashare_playbooks` playbook library · `ashare_market_kline` whole-market daily K-line · `ashare_news` stock news · `ashare_notice` filings · `ashare_abnormal` abnormal moves · `ashare_review` short-term review · `ashare_limit_up` limit-up pool · `ashare_auction` call auction

The list above covers the common ones; the full catalogue, field meanings, parameters and response samples are in the [docs](https://ashareapi.com/en/docs/).

---

## Development

```bash
npm test   # regression guard for config assembly and typo hints
```

The plugin is a single `index.js` file with **zero runtime dependencies**: configuration goes to DSH's own MCP client, so a DSH upgrade usually requires no change here.

---

## Related

**Official SDKs**: Python `pip install ashareapi` · Node.js / TypeScript `npm install ashareapi`

**MCP server**: `https://api.ashareapi.com/mcp` ([configuration guide](https://ashareapi.com/en/mcp/)) — not on DSH? Claude Code / Codex / Cursor and 19 clients in total just need a URL

**Official MCP Registry**: `com.ashareapi/ashare-data-api` — the MCP server this plugin talks to is listed there and can be found by name

**Docker** (self-hosted MCP): `docker.io/ashareapi/mcp` — for running the same MCP service on your own machine or inside your network; see Docker Hub for tags

**Agent Skill** (an endpoint manual for AI Agents): <https://ashareapi.com/en/skill/>

---

## Version

Current version **0.1.5**; see [CHANGELOG.md](CHANGELOG.md) for the full history.

---

## License

MIT
