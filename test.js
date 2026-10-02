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

import {
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
