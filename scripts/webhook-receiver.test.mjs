import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'

const SECRET = 'x'.repeat(40)
const PORT = 19000 + Math.floor(Math.random() * 500)
const dir = mkdtempSync(path.join(os.tmpdir(), 'hook-'))
const trace = path.join(dir, 'trace')
const fake = path.join(dir, 'fake-deploy.sh')
writeFileSync(fake, `#!/bin/bash\necho start >> ${trace}\nsleep 1\necho end >> ${trace}\n`)

let proc
const sign = (b, s = SECRET) => 'sha256=' + crypto.createHmac('sha256', s).update(b).digest('hex')
const post = (body, headers = {}) =>
  fetch(`http://127.0.0.1:${PORT}/webhook`, { method: 'POST', body, headers })
const push = (over = {}) =>
  JSON.stringify({ ref: 'refs/heads/main', after: 'abcdef1234567', repository: { full_name: 'MuhamadAdhiWinata/IT-Ticketing' }, ...over })
const valid = (body, event = 'push') => ({ 'x-hub-signature-256': sign(body), 'x-github-event': event })
const lines = () => (existsSync(trace) ? readFileSync(trace, 'utf8').trim().split('\n').filter(Boolean) : [])
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

before(async () => {
  proc = spawn('node', [path.resolve('scripts/webhook-receiver.mjs')], {
    env: { ...process.env, WEBHOOK_SECRET: SECRET, PORT: String(PORT), DEPLOY_SCRIPT: fake, LOG_FILE: path.join(dir, 'log') },
    stdio: 'ignore',
  })
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(`http://127.0.0.1:${PORT}/healthz`)).ok) return } catch {}
    await sleep(100)
  }
  throw new Error('receiver did not start')
})
after(() => proc?.kill())

test('rejections never start a deploy', async () => {
  const b = push()
  assert.equal((await post(b)).status, 401)
  assert.equal((await post(b, { 'x-hub-signature-256': sign(b, 'wrong'), 'x-github-event': 'push' })).status, 401)
  assert.equal((await post(b, { 'x-hub-signature-256': 'sha256=zz', 'x-github-event': 'push' })).status, 401)
  assert.equal((await post(b, valid(b, 'issues'))).status, 202)
  const other = push({ ref: 'refs/heads/dev' })
  assert.equal((await post(other, valid(other))).status, 202)
  const wrong = push({ repository: { full_name: 'evil/repo' } })
  assert.equal((await post(wrong, valid(wrong))).status, 403)
  assert.equal((await post('not json', valid('not json'))).status, 400)
  const big = 'a'.repeat(2 * 1024 * 1024)
  const r = await post(big, valid(big)).catch(() => ({ status: 413 }))
  assert.equal(r.status, 413)
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/other`)).status, 404)
  await sleep(300)
  assert.deepEqual(lines(), [])
})

test('ping is answered without deploy', async () => {
  const b = '{}'
  assert.equal((await post(b, valid(b, 'ping'))).status, 200)
  assert.deepEqual(lines(), [])
})

test('burst of pushes runs serially and coalesces', async () => {
  const b = push()
  const codes = await Promise.all([1, 2, 3].map(() => post(b, valid(b)).then((r) => r.status)))
  assert.deepEqual(codes, [202, 202, 202])
  await sleep(3500)
  assert.deepEqual(lines(), ['start', 'end', 'start', 'end'])
})
