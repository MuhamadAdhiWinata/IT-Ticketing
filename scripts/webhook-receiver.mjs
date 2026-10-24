import http from 'node:http'
import crypto from 'node:crypto'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SECRET = process.env.WEBHOOK_SECRET || ''
const HOST = process.env.HOST || '127.0.0.1'
const PORT = Number(process.env.PORT || 9000)
const REPO = 'MuhamadAdhiWinata/IT-Ticketing'
const REF = 'refs/heads/main'
const MAX_BODY = 1024 * 1024
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../deploy.sh')
const LOG_FILE = process.env.LOG_FILE || path.join(os.homedir(), 'deploy.log')

if (SECRET.length < 32) {
  console.error('WEBHOOK_SECRET missing or shorter than 32 chars')
  process.exit(1)
}

const logStream = createWriteStream(LOG_FILE, { flags: 'a', mode: 0o600 })
const log = (msg) => {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  logStream.write(line + '\n')
}

let running = false
let pending = false

function deploy(tag) {
  if (running) {
    pending = true
    log(`deploy busy, queued one follow-up (${tag})`)
    return 'queued'
  }
  running = true
  log(`deploy start (${tag})`)
  const child = spawn('/bin/bash', [DEPLOY_SCRIPT], { stdio: ['ignore', 'pipe', 'pipe'], timeout: 20 * 60 * 1000 })
  child.stdout.pipe(logStream, { end: false })
  child.stderr.pipe(logStream, { end: false })
  child.on('error', (e) => log(`deploy spawn error: ${e.code || 'unknown'}`))
  child.on('close', (code, signal) => {
    log(code === 0 ? 'deploy OK' : `deploy FAILED (code=${code} signal=${signal})`)
    running = false
    if (pending) {
      pending = false
      deploy('follow-up')
    }
  })
  return 'started'
}

function validSignature(body, header) {
  if (typeof header !== 'string' || !header.startsWith('sha256=')) return false
  const expected = Buffer.from('sha256=' + crypto.createHmac('sha256', SECRET).update(body).digest('hex'))
  const got = Buffer.from(header)
  return got.length === expected.length && crypto.timingSafeEqual(got, expected)
}

const send = (res, code, text) => {
  res.writeHead(code, { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(text) })
  res.end(text)
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/healthz') return send(res, 200, 'ok')
  if (req.method !== 'POST' || req.url !== '/webhook') return send(res, 404, 'not found')

  const declared = Number(req.headers['content-length'] || 0)
  if (declared > MAX_BODY) {
    log('reject: body too large')
    return send(res, 413, 'payload too large')
  }

  const chunks = []
  let size = 0
  let aborted = false
  req.on('data', (c) => {
    size += c.length
    if (size > MAX_BODY) {
      aborted = true
      log('reject: body too large')
      send(res, 413, 'payload too large')
      req.destroy()
      return
    }
    chunks.push(c)
  })
  req.on('end', () => {
    if (aborted) return
    const body = Buffer.concat(chunks)
    if (!validSignature(body, req.headers['x-hub-signature-256'])) {
      log('reject: bad or missing signature')
      return send(res, 401, 'invalid signature')
    }
    const event = req.headers['x-github-event']
    if (event === 'ping') {
      log('ping received')
      return send(res, 200, 'pong')
    }
    if (event !== 'push') {
      log(`ignore: event=${String(event).slice(0, 20).replace(/[^\w-]/g, '?')}`)
      return send(res, 202, 'ignored')
    }
    let payload
    try {
      payload = JSON.parse(body.toString('utf8'))
    } catch {
      log('reject: invalid JSON')
      return send(res, 400, 'invalid payload')
    }
    if (payload?.repository?.full_name !== REPO) {
      log('reject: wrong repository')
      return send(res, 403, 'wrong repository')
    }
    if (payload.ref !== REF) {
      log('ignore: branch is not main')
      return send(res, 202, 'ignored')
    }
    const sha = /^[0-9a-f]{7,40}$/.test(payload.after || '') ? payload.after.slice(0, 7) : 'unknown'
    log(`push accepted (commit ${sha})`)
    send(res, 202, deploy(`commit ${sha}`))
  })
  req.on('error', () => {})
})

server.requestTimeout = 10_000
server.headersTimeout = 10_000
server.listen(PORT, HOST, () => log(`receiver listening on ${HOST}:${PORT}`))
