/**
 * ashareapi-dsh-plugin — A股数据 API 官方 DeepSeek Harness 插件（Node 端）。
 *
 * 本插件只做一件事：把一个 `@deepseek-ai/dsh-mcp-client` 实例挂到当前 profile 上，
 * 指向 A股数据 API 的 MCP 端点。工具注册、命名（`mcp__ashareapi__*`）、重连与
 * 生命周期全部交给 DSH 自带的 mcp-client 插件，本插件不重复实现任何传输逻辑。
 *
 * 为什么不声明 `@deepseek-ai/dsh-mcp-client` 为依赖/peer：
 *   DSH 在加载每个 bundle 前，会把它的 `@deepseek-ai/dsh*` peer 声明拿去和**运行中的
 *   DSH 版本**比对，不匹配就把整个 bundle 跳过；而「不声明」不构成任何约束。
 *   mcp-client 由 DSH 安装本身提供（`@deepseek-ai/dsh` 的依赖里有它），启动器算出的
 *   runtime resolution 能解析到它。⇒ 不声明 = 宿主升级时本插件不会被判为不兼容。
 *   同理不导出 Config schema：实测 schemastery 既不拒绝未知键、也不校验 serverName
 *   的字符集，schema 抓不到真正会出事的两种错，却会多出一个随宿主漂移的依赖面。
 *
 * 配置（可选，写进 profile 的 `cordis.patch.yml` 里本条目下的 `config:`）：
 *   - `apiKey`     默认读环境变量 `ASHAREAPI_KEY`；不填则走匿名（仅 5 个免费工具）
 *   - `url`        默认 `https://api.ashareapi.com/mcp`
 *   - `serverName` 默认 `ashareapi`（工具名前缀 `mcp__ashareapi__`；`[A-Za-z0-9_-]{1,32}`）
 *   - `headers`    额外请求头（与上面的 Key 合并）
 *   其余字段（`toolCallTimeoutMs`、`failOnStartupError` 等）原样透传给 mcp-client。
 *
 * @see https://ashareapi.com/mcp
 * @see https://deepseek-harness.github.io/deepseek-harness/develop/basic/publish
 */

/** Cordis 插件名（用于加载器诊断与 profile 里的条目名）。 */
export const name = 'ashareapi'

/** 依赖的服务：mcp-client 通过 `ctx.tools` 注册工具。 */
export const inject = ['tools']

/** 官方 MCP 端点。 */
export const DEFAULT_URL = 'https://api.ashareapi.com/mcp'

/** 默认工具命名空间。 */
export const DEFAULT_SERVER_NAME = 'ashareapi'

/** 本插件自己拥有的配置字段；其余字段透传给 mcp-client。 */
const OWN_FIELDS = ['apiKey', 'url', 'serverName', 'headers']

/** mcp-client 对 `serverName` 的硬约束。 */
const SERVER_NAME_RE = /^[A-Za-z0-9_-]{1,32}$/

/** 归一化字段名，用于识别 `api_key` / `api-key` / `APIKEY` 这类拼写变体。 */
function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, '')
}

/**
 * 找出配置里「像是本插件字段但拼错了」的键。
 *
 * 为什么需要：schemastery 会**原样放行未知键**（实测），所以 `api_key:` 这种拼写
 * 不会报错，只会被静默忽略 —— 用户会以为 Key 配上了，实际仍走匿名，直到付费工具
 * 报 401 才发现。这里只对自己拥有的 4 个字段做提示，不替 mcp-client 管它的字段。
 *
 * @param config - 用户传入的配置。
 * @returns 人类可读的提示语列表（可能为空）。
 */
export function typoHints(config) {
  const hints = []
  for (const key of Object.keys(config ?? {})) {
    if (OWN_FIELDS.includes(key)) continue
    const hit = OWN_FIELDS.find((field) => normalizeKey(field) === normalizeKey(key))
    if (hit) hints.push(`配置里的 \`${key}\` 可能想写 \`${hit}\` —— 拼错的字段会被忽略`)
  }
  if (config && 'apiKey' in config && !String(config.apiKey ?? '').trim()) {
    hints.push('`apiKey` 是空的 —— 将按匿名运行，只有 5 个免费工具可用')
  }
  return hints
}

/**
 * 组装交给 mcp-client 的配置。
 *
 * 独立成纯函数是为了可测试。这里有三个**真实踩过的坑**：
 *   1. 若用模板字面量拼 `Bearer ${process.env.ASHAREAPI_KEY}`，环境变量缺失时会得到
 *      字符串 `"Bearer undefined"`，服务端会把 `undefined` 当成一个无效 Key 直接拒绝
 *      （而不是回落成匿名）⇒ Key 为空时必须**完全不发** `Authorization` 头。
 *   2. `serverName` 决定工具名（`mcp__<serverName>__<工具>`），而 mcp-client 的 schema
 *      实测**不校验**它的字符集 ⇒ 写错了会得到一堆非法工具名，必须在这里挡住。
 *   3. `url` 写错时，mcp-client 会静默连接失败（`failOnStartupError` 默认 false）⇒
 *      同样在这里挡住，让配置错误在加载时就响亮。
 *
 * @param config - 本插件的配置。
 * @param env - 环境变量来源，默认 `process.env`。
 * @returns 传给 `@deepseek-ai/dsh-mcp-client` 的 Streamable HTTP 配置。
 * @throws 当 `serverName` 或 `url` 不合法时。
 */
export function buildMcpConfig(config = {}, env = process.env) {
  const {
    apiKey,
    url = DEFAULT_URL,
    serverName = DEFAULT_SERVER_NAME,
    headers,
    ...rest
  } = config ?? {}

  if (!SERVER_NAME_RE.test(String(serverName))) {
    throw new Error(
      `[ashareapi] serverName 非法：${JSON.stringify(serverName)} —— ` +
        '只允许字母、数字、下划线、连字符，长度 1~32',
    )
  }

  let parsed
  try {
    parsed = new URL(String(url))
  } catch {
    throw new Error(`[ashareapi] url 不是合法地址：${JSON.stringify(url)}`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`[ashareapi] url 必须是 http(s) 地址：${JSON.stringify(url)}`)
  }

  const key = String(apiKey ?? env?.ASHAREAPI_KEY ?? '').trim()
  const merged = { ...(headers ?? {}) }
  if (key) merged.Authorization = `Bearer ${key}`

  return {
    serverName,
    transport: 'streamable-http',
    url: String(url),
    headers: merged,
    ...rest,
  }
}

/** 通过宿主 logger 报警告；没有 logger 时退到 stderr。 */
function warn(ctx, message) {
  const line = `[ashareapi] ${message}`
  if (typeof ctx?.logger?.warn === 'function') ctx.logger.warn(line)
  else console.warn(line)
}

/**
 * 挂载 mcp-client 实例。
 *
 * 保持 `async`：Cordis 会把「带 prototype 的普通函数」当成构造函数，其返回的
 * Promise 就不算启动工作；显式 `async` 才能让启动就绪被正确等待。
 *
 * ⚠️⚠️ 但**必须是 `await`，绝不能是 `return`**：`ctx.plugin()` 返回的是
 * `Object.create(fiber)` 并挂了 `.then` 的 **thenable**。`apply` 是 async，
 * 于是 `return ctx.plugin(...)` 会被 await 成那个 fiber 对象 —— 而 Cordis 的
 * `safeCollect` 会把「非函数、非 null」的返回值当成 dispose 回调回收，
 * 直接抛 `TypeError: Invalid effect`，整个条目激活失败。
 * 症状很隐蔽：插件装不上（`1 entry did not activate`），但 `--dump-config` 里
 * 条目仍在、bundle 合成与依赖解析全正常、与 Key 和网络都无关。
 * 改用 `await` 后，既等子插件启动就绪，又让 `apply` resolve 成 `undefined`。
 *
 * @param ctx - Cordis 上下文。
 * @param config - 见 {@link buildMcpConfig}。
 */
export async function apply(ctx, config = {}) {
  for (const hint of typoHints(config)) warn(ctx, hint)

  let mcpClient
  try {
    mcpClient = await import('@deepseek-ai/dsh-mcp-client')
  } catch (error) {
    throw new Error(
      '[ashareapi] 找不到 @deepseek-ai/dsh-mcp-client —— 它随 DeepSeek Harness 一起安装。' +
        '请确认 DSH 版本（`dsh --version`）不低于 0.2.0-rc.2，然后重试；' +
        `原始错误：${error && error.message ? error.message : error}`,
    )
  }

  await ctx.plugin(mcpClient, buildMcpConfig(config))
}
