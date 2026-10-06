/**
 * 回归护栏：`buildMcpConfig` 的配置组装与 `typoHints` 的拼写提示。
 *
 * 最要紧的三条：
 *   1. 无 Key 时**不得**发出 Authorization 头 —— 用模板字面量会拼出
 *      `"Bearer undefined"`，服务端会把它当成无效 Key 拒绝，而不是回落成匿名，
 *      于是 5 个免费工具也跟着不可用。
 *   2. `serverName` 非法必须**当场报错** —— mcp-client 的 schema 实测不校验字符集，
 *      放过去会得到一堆非法工具名。
 *   3. `url` 非法必须当场报错 —— `failOnStartupError` 默认 false，否则会静默连接失败。
 *
 * 运行：npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  apply,
  buildMcpConfig,
  DEFAULT_SERVER_NAME,
  DEFAULT_URL,
  inject,
  name,
  typoHints,
} from './index.js'

test('插件身份常量稳定', () => {
  assert.equal(name, 'ashareapi')
  assert.deepEqual(inject, ['tools'])
  assert.equal(DEFAULT_URL, 'https://api.ashareapi.com/mcp')
  assert.equal(DEFAULT_SERVER_NAME, 'ashareapi')
})

test('无 Key 时不发 Authorization（免费工具仍可用）', () => {
  const cfg = buildMcpConfig({}, {})
  assert.deepEqual(cfg.headers, {})
  assert.ok(!('Authorization' in cfg.headers))
})

test('Key 为空白字符时同样不发 Authorization', () => {
  for (const blank of ['', '   ', '\t', '\n']) {
    const cfg = buildMcpConfig({ apiKey: blank }, {})
    assert.ok(!('Authorization' in cfg.headers), `空白 Key ${JSON.stringify(blank)} 不应发出请求头`)
  }
})

test('config.apiKey 优先生效', () => {
  const cfg = buildMcpConfig({ apiKey: 'ct-abc' }, { ASHAREAPI_KEY: 'ct-env' })
  assert.equal(cfg.headers.Authorization, 'Bearer ct-abc')
})

test('环境变量 ASHAREAPI_KEY 作为回退', () => {
  const cfg = buildMcpConfig({}, { ASHAREAPI_KEY: 'ct-env' })
  assert.equal(cfg.headers.Authorization, 'Bearer ct-env')
})

test('Key 两端空白被裁掉', () => {
  const cfg = buildMcpConfig({ apiKey: '  ct-pad  ' }, {})
  assert.equal(cfg.headers.Authorization, 'Bearer ct-pad')
})

test('默认端点与命名空间', () => {
  const cfg = buildMcpConfig({}, {})
  assert.equal(cfg.url, DEFAULT_URL)
  assert.equal(cfg.serverName, DEFAULT_SERVER_NAME)
  assert.equal(cfg.transport, 'streamable-http')
})

test('url 与 serverName 可覆盖', () => {
  const cfg = buildMcpConfig({ url: 'https://mcp.example.com/mcp', serverName: 'ashare-proxy' }, {})
  assert.equal(cfg.url, 'https://mcp.example.com/mcp')
  assert.equal(cfg.serverName, 'ashare-proxy')
})

test('自定义 headers 与 Authorization 合并', () => {
  const cfg = buildMcpConfig({ apiKey: 'ct-x', headers: { 'X-Trace': '1' } }, {})
  assert.deepEqual(cfg.headers, { 'X-Trace': '1', Authorization: 'Bearer ct-x' })
})

test('其余字段原样透传给 mcp-client', () => {
  const cfg = buildMcpConfig({ toolCallTimeoutMs: 30000, failOnStartupError: true }, {})
  assert.equal(cfg.toolCallTimeoutMs, 30000)
  assert.equal(cfg.failOnStartupError, true)
})

test('config 省略时不抛错', () => {
  assert.equal(buildMcpConfig().url, DEFAULT_URL)
  assert.equal(buildMcpConfig(undefined, undefined).serverName, DEFAULT_SERVER_NAME)
})

test('serverName 非法时当场报错', () => {
  for (const bad of ['a b', '', 'x'.repeat(33), '中文名', 'a/b']) {
    assert.throws(() => buildMcpConfig({ serverName: bad }, {}), /serverName 非法/, `应拒绝 ${JSON.stringify(bad)}`)
  }
})

test('serverName 合法字符集被接受', () => {
  for (const ok of ['a', 'A1', 'a_b-c', 'x'.repeat(32)]) {
    assert.equal(buildMcpConfig({ serverName: ok }, {}).serverName, ok)
  }
})

test('url 非法时当场报错', () => {
  for (const bad of ['not-a-url', '', 'api.ashareapi.com/mcp']) {
    assert.throws(() => buildMcpConfig({ url: bad }, {}), /url 不是合法地址/, `应拒绝 ${JSON.stringify(bad)}`)
  }
})

test('url 非 http(s) 时当场报错', () => {
  assert.throws(() => buildMcpConfig({ url: 'ftp://example.com/mcp' }, {}), /必须是 http\(s\)/)
})

test('typoHints：识别 apiKey 的常见拼写变体', () => {
  for (const variant of ['api_key', 'api-key', 'APIKEY', 'Api_Key']) {
    const hints = typoHints({ [variant]: 'ct-1' })
    assert.equal(hints.length, 1, `${variant} 应给出一条提示`)
    assert.match(hints[0], /apiKey/)
  }
})

test('typoHints：合法配置与透传字段不产生噪音', () => {
  assert.deepEqual(typoHints({ apiKey: 'ct-1', url: DEFAULT_URL, serverName: 'ashareapi' }), [])
  assert.deepEqual(typoHints({ toolCallTimeoutMs: 1000, failOnStartupError: true }), [])
  assert.deepEqual(typoHints(), [])
  assert.deepEqual(typoHints(undefined), [])
})

test('typoHints：apiKey 为空时给出提示', () => {
  const hints = typoHints({ apiKey: '   ' })
  assert.equal(hints.length, 1)
  assert.match(hints[0], /免费工具/)
})

test('typoHints：serverName 的变体同样被识别', () => {
  for (const variant of ['server_name', 'servername', 'Server-Name']) {
    const hints = typoHints({ [variant]: 'x' })
    assert.equal(hints.length, 1, `${variant} 应给出一条提示`)
    assert.match(hints[0], /serverName/)
  }
})

/**
 * ⭐ 回归护栏：`apply` **不得**把 `ctx.plugin()` 的返回值 `return` 出去。
 *
 * 原因：`apply` 是 async，而 `ctx.plugin()` 返回的是 `Object.create(fiber)`
 * 且挂了 `.then` 的 **thenable**。`return ctx.plugin(...)` 会被 await 成那个
 * fiber 对象，Cordis 的 `safeCollect` 把它当成「非函数的 dispose 回调」
 * ⇒ 抛 `TypeError: Invalid effect`，插件条目无法激活。
 *
 * ⚠️ 为什么必须专门测：上面那些用例全在测纯函数（`buildMcpConfig` / `typoHints`），
 * 漏掉了 `apply` 的**返回值语义** —— 单测全绿也不代表插件装得上。
 *
 * 做法：临时造一个假的 `@deepseek-ai/dsh-mcp-client`（真实包随 DSH 一起安装，
 * CI 里没有），再给一个「`plugin()` 返回 thenable」的假 ctx —— 形状与 cordis
 * 的 `Context.plugin()` 一致。跑完即清理。
 */
test('apply resolve 为 undefined（不得 return ctx.plugin() 的 thenable）', async () => {
  const root = dirname(fileURLToPath(import.meta.url))
  const modulesDir = join(root, 'node_modules')
  const scopeDir = join(modulesDir, '@deepseek-ai')
  const stubDir = join(scopeDir, 'dsh-mcp-client')
  const preexisting = existsSync(stubDir)
  const modulesDirExisted = existsSync(modulesDir)

  if (!preexisting) {
    await mkdir(stubDir, { recursive: true })
    await writeFile(
      join(stubDir, 'package.json'),
      JSON.stringify({
        name: '@deepseek-ai/dsh-mcp-client',
        version: '0.0.0-test-stub',
        type: 'module',
        main: 'index.js',
      }),
    )
    await writeFile(
      join(stubDir, 'index.js'),
      'export default { name: "mcp-client-stub", apply() {} }\n',
    )
  }

  try {
    let calls = 0
    // 假 ctx：plugin() 返回 thenable —— 复刻 cordis Context.plugin() 的返回值形状。
    // ⚠️ 必须 resolve 成**对象**（cordis 的 Fiber.await() 是 `return this`），
    //    否则 async 解包后得到 undefined，会变成假绿灯（实测踩过）。
    const fakeFiber = { id: 'fake-fiber' }
    const fakeCtx = {
      logger: { warn() {} },
      plugin() {
        calls += 1
        const wrapped = Object.create(fakeFiber)
        wrapped.then = (onFulfilled) => Promise.resolve().then(() => onFulfilled(fakeFiber))
        return wrapped
      },
    }

    const result = await apply(fakeCtx, {})

    assert.equal(calls, 1, 'apply 必须把配置交给 ctx.plugin()')
    assert.equal(
      result,
      undefined,
      'apply 必须 resolve 为 undefined —— 返回 ctx.plugin() 的 thenable 会让 cordis 收到 fiber 对象并抛 Invalid effect',
    )
  } finally {
    if (!preexisting) {
      await rm(scopeDir, { recursive: true, force: true })
      if (!modulesDirExisted) await rm(modulesDir, { recursive: true, force: true })
    }
  }
})
