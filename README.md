<div align="center">

<a href="https://ashareapi.com"><img src="https://ashareapi.com/icon-512.png" width="88" height="88" alt="ashareapi"></a>

# ashareapi — A股数据 API 官方 DeepSeek Harness 插件

让 **DeepSeek Harness（DSH）** 直接调用 A 股数据：行情（分时 · 五档盘口）/ K线 / 财务 / 资金 / 龙虎榜 / L2 大单 / 板块 / 因子选股 / 量化回测 / 短线打板 / 集合竞价 / 期货外汇 / 宏观 / 自选列表 / 资讯公告 —— **94 个工具，免费工具无需 Key**。

桌面端、Web UI、命令行都能装 —— [下载桌面端](https://www.deepseek.com/harness/) 后，在「插件」页里输个包名就行。

![Node.js](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-plugin-4D6BFE)
[![npm](https://img.shields.io/npm/v/ashareapi-dsh-plugin?label=npm)](https://www.npmjs.com/package/ashareapi-dsh-plugin)
![License](https://img.shields.io/badge/license-MIT-green)

**支持 DeepSeek Harness 桌面端与 Web UI**：

![DeepSeek Harness 桌面端](https://img.shields.io/badge/DeepSeek%20Harness-Desktop-4D6BFE?logo=deepseek&logoColor=white)
![DeepSeek Harness Web UI](https://img.shields.io/badge/DeepSeek%20Harness-Web%20UI-4D6BFE?logo=deepseek&logoColor=white)

**中文** · [English](README.en.md)

[官网](https://ashareapi.com) · [DSH 插件](https://ashareapi.com/dsh/) · [文档](https://ashareapi.com/docs/) · [端点清单](https://ashareapi.com/endpoints/) · [MCP 接入](https://ashareapi.com/mcp) · [Agent Skill](https://ashareapi.com/skill)

[GitHub 源码](https://github.com/ashareapi/ashareapi-dsh-plugin) · [问题反馈 Issues](https://github.com/ashareapi/ashareapi-dsh-plugin/issues) · [更新日志](https://ashareapi.com/changelog)

</div>

---

## 这是什么

一个 **A股数据 DeepSeek Harness 插件**：装上之后，你在 DSH 里问「600667 现在多少钱」，它会自己去调工具拿**真实数据**，而不是编一个数给你。

桌面端、Web UI、命令行都能用 —— 桌面端 / Web UI 在「插件」页面输一个包名；命令行一条命令。

底层接的是 [ashareapi.com](https://ashareapi.com) 的 **MCP 服务**（一个 URL）。插件把它挂进 DSH —— 传输、工具注册、断线重连由 DSH 自带的 MCP 客户端处理，所以 DSH 升级时插件基本不用跟着改。

---

## 为什么用它

- **94 个工具，一次配好**：行情 / K线 / 五档盘口 / 全字段画像 / 财务 / 资金 / 龙虎榜 / 板块 / 可转债 / ETF / 因子选股 / 量化回测 / 异动偏离值 / 集合竞价 / 期货外汇 / 宏观 / 自选列表 / 资讯公告 —— 覆盖 A 股主流面
- **桌面端 / Web UI 输个包名就装好**：不用配 JSON、不用写脚本，装完重启即可用
- **免费工具真的免 Key**：`ashare_quote` / `ashare_kline` / `ashare_hot` / `ashare_market_overview` / `ashare_changedist` / `ashare_wiki_search` 这 6 个装上就能调，不用先买 Key
- **盘中数据不缓存**：每次调用都重新取 · `minute` 分时（当日 242 点）· `auction` 集合竞价分时（9:15–9:25，约 150 个点）
- **K 线 10 年历史**：2016-08-08 起，`kline_full` 一次拿全（约 2,500 根；每只从其上市日开始）；日 / 周 / 月 / 季 / 年 + 分钟线 `m1`–`m120`
- **全市场一次拿**：`market_kline` 一次返回某交易日**全部 A 股（5,000+ 只）**的日线 —— 不用循环 5,000 次
- **L2 微观结构 7 个工具**：全市场主力净额榜**一次 5,568 只** · 龙虎榜席位穿透到**营业部级** · 大单四方向 / 挂撤单队列 / 100 日历史大单
- **批量工具 9 个**：行情 / K 线 / 快照 / 财务 / 技术 / 筹码 / 股东 / 资金流 / 公司简况，**一次 150 只约 2 秒**
- **一个 Key 覆盖 5 个市场**：A 股 + 场内 ETF（1,716 只）+ 港股 + 美股 + 期货外汇（65 个品种）
- **量化五位一体**：87 因子 + 29 策略 + 25 方法论 + 回测（单标的 / 组合 / 批量）+ 组合权重优化
- **不该扣的就不扣**：空结果、取数失败、代码传错 —— 都**不计费**（按实际返回只数计）
- **出问题能定位**：每次响应带 `trace_id`，报障时报这个号，直接查到那一次请求
- **多源自动切换**：后端 70 个数据源互为备份，某个源出问题会自动换下一个，且**不扣调用次数**
- **口径固定，不用二次处理**：K 线固定**前复权**（没有 `adjust` 参数），不会二次复权
- **无数据 ≠ 失败**：停牌这类「市场真没数据」和「取数失败」分开返回 —— Agent 不会把停牌误判成故障
- **工具描述写给 AI Agent 看**：每个工具都写清「什么时候用 / 参数怎么填 / 返回什么」，Agent 不会调错
- **一份配置就够，不用你维护**：多源切换 / 缓存 / 巡检都在服务端 —— 装上就能用，出问题也好定位

---

## 安装

### 桌面端 / Web UI（推荐）

[下载 DeepSeek Harness 桌面端](https://www.deepseek.com/harness/)（macOS / Windows）后，打开左侧「**插件**」页面，输入包名：

```
ashareapi-dsh-plugin
```

Web UI（`dsh web`）里是同一个「插件」页面，操作一样。装完直接就能在对话里用 —— 不用命令行、不用改配置文件。

### 命令行

```bash
npx @deepseek-ai/dsh web                                    # 启动 Web UI
npx @deepseek-ai/dsh plugin --profile web add ashareapi-dsh-plugin
```

（已全局装过 `dsh` 的话，把 `npx @deepseek-ai/dsh` 换成 `dsh` 即可。）

> 命令行安装和 Web UI 的「插件」页面都会调用本机的 **pnpm**（DSH 不自带，桌面端自带一份）—— 没装的话先 `npm i -g pnpm`。

装完**重启 `dsh web`** 生效。启动前也可以先确认这一层挂上了：

```bash
npx @deepseek-ai/dsh --profile web --dump-config   # 输出里应出现 # == ashareapi-dsh-plugin
```

> ⚠️ 桌面端的 profile 由桌面应用自己管理，**不能用命令行装** —— 桌面端请走上面的「插件」页面。

然后在对话里直接问：

| 你可以这样问 | 会用到的工具 |
|---|---|
| 600667 现在多少钱？ | `ashare_quote` |
| 帮我拉一下 600667 最近 60 天的日 K | `ashare_kline` |
| 今天市场什么情况？ | `ashare_market_overview` |
| 现在大家都在看什么股票？ | `ashare_hot` |
| 今天涨跌家数怎么分布？ | `ashare_changedist` |

其他安装方式（命令行）：

```bash
# 从 GitHub
npx @deepseek-ai/dsh plugin --profile web add github:ashareapi/ashareapi-dsh-plugin

# 从本地目录（开发调试）
npx @deepseek-ai/dsh plugin --profile web add file:/绝对路径/ashareapi-dsh-plugin
```

> 本插件是纯 JavaScript、**没有构建步骤**，所以从 GitHub 装也是装完即用 —— 不需要给 pnpm 开 `allowBuilds` 授权。

卸载：

```bash
npx @deepseek-ai/dsh plugin --profile web remove ashareapi-dsh-plugin
```

---

## 配置 API Key

上面 6 个免费工具**不用配任何东西**就能用。

要用其余 88 个工具（盘口 / 财务 / 资金 / 龙虎榜 / 板块 / 选股 / 宏观 / 量化回测 / 短线打板 / 期货外汇 / 资讯公告…），需要一个 Key：[获取 Key](https://ashareapi.com/pricing)。体验版 ¥9.9 起；**部分工具需要更高档位** —— 量化回测 / 因子 / 策略属专业版（¥99），期货 / 外汇属机构版（¥199），各工具所需档位见[定价页](https://ashareapi.com/pricing)。

**方式一：环境变量**（最省事）

在 `~/.dsh/.env` 里加一行（`$DSH_HOME` 改过就放那儿）：

```
ASHAREAPI_KEY=ct-你的KEY
```

**方式二：写进 profile**

编辑对应 profile 的 `cordis.patch.yml` —— Web UI / 命令行是 `~/.dsh/profiles/web/cordis.patch.yml`，桌面端是 `~/.dsh/profiles/desktop/cordis.patch.yml`（桌面端的目录要先打开一次桌面端才会生成）。加一条按 id 覆盖的补丁：

```yaml
- id: mcp-ashareapi
  name: ashareapi-dsh-plugin
  config:
    apiKey: ct-你的KEY
```

> ⚠️ 这条补丁会**整块替换**该条目的 `config`，所以只写你要改的字段即可 —— 其余字段（端点、命名空间）用插件内置默认值。

**可配置项**

| 字段 | 默认值 | 说明 |
|---|---|---|
| `apiKey` | 读环境变量 `ASHAREAPI_KEY` | 不填则走匿名，只有 6 个免费工具可用 |
| `url` | `https://api.ashareapi.com/mcp` | 走自建代理时改这里 |
| `serverName` | `ashareapi` | 工具名前缀，即 `mcp__ashareapi__*`；`[A-Za-z0-9_-]{1,32}` |
| `headers` | `{}` | 额外请求头，与上面的 Key 合并 |

其余字段（`toolCallTimeoutMs`、`failOnStartupError` 等）由 DSH 自带的 MCP 客户端处理 —— 照 DSH 文档的写法直接用即可。

---

## 工具

装好后工具名形如 `mcp__ashareapi__ashare_quote`。

**免费（无需 Key）**

`ashare_quote` 实时快照 · `ashare_kline` K线 · `ashare_hot` 热搜榜 · `ashare_changedist` 涨跌分布 · `ashare_market_overview` 市场总览 · `ashare_wiki_search` 文档检索

> 免费 / 匿名档按 **5 分钟**刷新（保障服务稳定性）；付费档实时。

**需 Key**

`ashare_orderbook` 五档盘口 · `ashare_snapshot` 全字段画像 · `ashare_finance` 财务 · `ashare_fund` 资金流 · `ashare_technical` 技术指标 · `ashare_shareholder` 股东 · `ashare_events` 事件 · `ashare_lhb` 龙虎榜 · `ashare_screen` 因子选股 · `ashare_sector` 板块 · `ashare_sector_valuation` 板块估值 · `ashare_macro` 宏观 · `ashare_bond` 可转债 · `ashare_etf` ETF · `ashare_ipo` 新股 · `ashare_dividend` 分红 · `ashare_dehydrated` 脱水研报 · `ashare_search` 代码搜索 · `ashare_usage` 用量 · `ashare_minute` 分时 · `ashare_kline_full` 全历史K线 · `ashare_backtest` 量化回测 · `ashare_backtest_batch` 批量回测 · `ashare_strategies` 策略清单 · `ashare_factors` 因子库 · `ashare_playbooks` 方法论库 · `ashare_market_kline` 全市场单日K线 · `ashare_news` 个股资讯 · `ashare_notice` 公告 · `ashare_abnormal` 异动/偏离值 · `ashare_review` 短线复盘 · `ashare_limit_up` 涨停池 · `ashare_auction` 集合竞价

以上为常用工具；完整清单、字段含义、参数与返回样例见[文档](https://ashareapi.com/docs/)。

---

## 开发

```bash
npm test   # 配置组装 + 拼写提示的回归护栏
```

插件本体只有 `index.js` 一个文件、**零运行时依赖**：配置交给 DSH 自带的 MCP 客户端处理 —— 所以 DSH 升级时通常不需要跟着改。

---

## 相关

**官方 SDK**：Python `pip install ashareapi` · Node.js / TypeScript `npm install ashareapi`

**MCP 服务器**：`https://api.ashareapi.com/mcp`（[配置说明](https://ashareapi.com/mcp)）—— 不用 DSH？Claude Code / Codex / Cursor 等 19 家客户端填一条 URL 就能接

**官方 MCP Registry**：`com.ashareapi/ashare-data-api` —— 本插件底层用的 MCP 服务器已被收录，可按名字检索

**Docker**（自托管 MCP）：`docker.io/ashareapi/mcp` —— 想把同一个 MCP 服务跑在自己机器 / 内网时用，tag 见 Docker Hub

**Agent Skill**（给 AI Agent 读的接口说明书）：<https://ashareapi.com/skill>

---

## 版本

当前版本 **0.1.5**，完整记录见 [CHANGELOG.md](CHANGELOG.md)。

---

## License

MIT
