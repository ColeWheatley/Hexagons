#!/usr/bin/env node
// One shared HTTP/2 downlink for a replayable production mirror and local builds.
import http2 from 'node:http2';
import https from 'node:https';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

export const PROFILES = {
  cafe: { bandwidthBps: 18e6 / 8, rttMs: 90, bloatMs: 450 },
  slow: { bandwidthBps: 5e6 / 8, rttMs: 150, bloatMs: 600 },
  fast: { bandwidthBps: 100e6 / 8, rttMs: 20, bloatMs: 20 },
  none: { bandwidthBps: Infinity, rttMs: 0, bloatMs: 0 },
};
export class Downlink {
  constructor(profile = PROFILES.none, now = () => performance.now()) {
    this.profile = profile; this.now = now; this.jobs = []; this.cursor = 0;
    this.nextAt = 0; this.timer = null;
    setInterval(() => {
      for (const job of [...this.jobs]) if (job.response.destroyed || job.response.stream?.closed) {
        const error = new Error('stream closed'); error.sent = job.sent; this.finish(job, error);
      }
    }, 1000).unref();
  }
  get queuedBytes() { return this.jobs.reduce((n, j) => n + j.remaining, 0); }
  firstByteDelay() {
    const p = this.profile;
    return p.rttMs + (Number.isFinite(p.bandwidthBps)
      ? p.bloatMs * Math.min(1, this.queuedBytes / (p.bandwidthBps * .5)) : 0);
  }
  send(file, start, length, response) {
    return this.enqueue({fd: fs.openSync(file, 'r'), offset: start, remaining: length}, response);
  }
  sendBuffer(buffer, response) {
    return this.enqueue({fd: null, buffer, offset: 0, remaining: buffer.length}, response);
  }
  enqueue(source, response) {
    return new Promise((resolve, reject) => {
      if (!source.remaining) { if (source.fd !== null) fs.closeSync(source.fd); response.end(resolve); return; }
      const job = {...source, sent: 0, response, resolve, reject, blocked: false, done: false};
      this.jobs.push(job);
      const closed = () => {
        if (!job.done) { const error = new Error('client closed'); error.sent = job.sent; this.finish(job, error); }
      };
      response.on('close', closed); response.stream?.on('close', closed);
      this.schedule();
    });
  }
  finish(job, error = null) {
    if (job.done) return;
    job.done = true;
    if (job.fd !== null) fs.closeSync(job.fd);
    const i = this.jobs.indexOf(job);
    if (i >= 0) this.jobs.splice(i, 1);
    if (error) job.reject(error);
    else job.response.end(job.resolve);
    this.schedule();
  }
  schedule() {
    if (this.timer || !this.jobs.length) return;
    this.cursor %= this.jobs.length;
    let job;
    for (let n = 0; n < this.jobs.length; n++) {
      const candidate = this.jobs[(this.cursor + n) % this.jobs.length];
      if (!candidate.blocked) { job = candidate; break; }
    }
    if (!job) return;
    let delay = 0;
    if (Number.isFinite(this.profile.bandwidthBps)) {
      const now = this.now();
      if (!this.nextAt || this.nextAt < now - 100) this.nextAt = now;
      this.nextAt += Math.min(16384, job.remaining) / this.profile.bandwidthBps * 1000;
      delay = Math.max(0, this.nextAt - now);
    }
    const run = () => { this.timer = null; this.tick(); };
    this.timer = delay < 1 ? setImmediate(run) : setTimeout(run, delay);
  }

}

// Keep the last chunk in order: Node's writable.end(chunk) combines data + EOF.
Downlink.prototype.tick = function () {
  if (!this.jobs.length) return;
  this.cursor %= this.jobs.length;
  let job;
  for (let n = 0; n < this.jobs.length; n++) {
    const candidate = this.jobs[(this.cursor + n) % this.jobs.length];
    if (!candidate.blocked) { job = candidate; this.cursor = (this.jobs.indexOf(job) + 1) % this.jobs.length; break; }
  }
  if (!job) return;
  const bytes = Math.min(16384, job.remaining);
  const buf = job.buffer ? job.buffer.subarray(job.offset, job.offset + bytes) : Buffer.allocUnsafe(bytes);
  try {
    const got = job.buffer ? bytes : fs.readSync(job.fd, buf, 0, bytes, job.offset);
    if (got !== bytes) throw new Error('short read');
    job.offset += got; job.remaining -= got; job.sent += got;
    if (job.remaining === 0) {
      job.done = true; if (job.fd !== null) fs.closeSync(job.fd);
      this.jobs.splice(this.jobs.indexOf(job), 1);
      if (!this.jobs.length) this.nextAt = 0;
      job.response.end(buf, job.resolve);
    } else if (!job.response.write(buf)) {
      job.blocked = true;
      job.response.once('drain', () => { job.blocked = false; this.schedule(); });
    }
  } catch (e) { this.finish(job, e); }
  this.schedule();
};

export function parseRange(value, size) {
  if (!value) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!m || (!m[1] && !m[2]) || size === 0) return false;
  let a, b;
  if (!m[1]) { const n = Number(m[2]); if (!n) return false; a = Math.max(0, size - n); b = size - 1; }
  else { a = Number(m[1]); b = m[2] ? Math.min(size - 1, Number(m[2])) : size - 1; }
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a >= size || b < a) return false;
  return {start: a, end: b};
}
function args(argv) {
  const cfg = {port: 8443, host: '127.0.0.1', profile: 'cafe', offline: false,
    mirrorDir: path.join(os.homedir(), 'dev/hexagons-netlab-mirror'), proxy: [], static: []};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]; if (arg === '--offline') { cfg.offline = true; continue; }
    const value = argv[++i]; if (!value) throw new Error(`missing ${arg}`);
    if (arg === '--port') cfg.port = Number(value);
    else if (arg === '--host') cfg.host = value;
    else if (arg === '--profile') cfg.profile = value;
    else if (arg === '--log') cfg.log = value;
    else if (arg === '--mirror-dir') cfg.mirrorDir = value;
    else if (arg === '--proxy-mount' || arg === '--static-mount') {
      const at = value.indexOf('='); if (at < 1) throw new Error(`bad mount: ${value}`);
      cfg[arg === '--proxy-mount' ? 'proxy' : 'static'].push([value.slice(0, at), value.slice(at + 1)]);
    } else throw new Error(`unknown flag ${arg}`);
  }
  if (!PROFILES[cfg.profile]) throw new Error(`unknown profile ${cfg.profile}`);
  return cfg;
}
function upstreamGet(url, dest) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {headers: {'accept-encoding': 'br, gzip'}}, response => {
      if ([301,302,307,308].includes(response.statusCode) && response.headers.location) {
        response.resume(); resolve(upstreamGet(new URL(response.headers.location, url), dest)); return;
      }
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`upstream ${response.statusCode}: ${url}`)); return; }
      const out = fs.createWriteStream(dest);
      response.pipe(out);
      out.on('finish', () => out.close(() => resolve({
        'content-type': response.headers['content-type'],
        'cache-control': response.headers['cache-control'],
        'content-encoding': response.headers['content-encoding'], etag: response.headers.etag,
      })));
      out.on('error', reject); response.on('error', reject);
    });
    request.on('error', reject);
  });
}
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.wasm':'application/wasm',
  '.woff2':'font/woff2','.ktx2':'image/ktx2','.webp':'image/webp','.png':'image/png',
  '.gsp':'application/octet-stream','.bin':'application/octet-stream'};
function staticHeaders(file) {
  const name = path.basename(file);
  return {'content-type': MIME[path.extname(name)] || 'application/octet-stream',
    'cache-control': /\.html$|^tile_manifest\.json$/.test(name) ? 'no-cache, no-store, must-revalidate'
      : /\.[0-9a-f]{12}\./.test(name) ? 'public, max-age=31536000, immutable' : 'public, max-age=300'};
}
export async function startServer(cfg) {
  const start = performance.now(), downlink = new Downlink(PROFILES[cfg.profile]);
  const stats = {requests: 0, active: 0, bytes: 0, hits: 0, misses: 0, errors: 0, lastRequestMs: 0};
  const pending = new Map();
  const certDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '.cert');
  await fsp.mkdir(certDir, {recursive:true});
  const key = path.join(certDir, 'key.pem'), cert = path.join(certDir, 'cert.pem');
  if (!fs.existsSync(key) || !fs.existsSync(cert)) execFileSync('openssl', ['req','-x509','-newkey','rsa:2048',
    '-nodes','-keyout',key,'-out',cert,'-days','3650','-subj','/CN=localhost',
    '-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'], {stdio:'ignore'});
  if (cfg.log) await fsp.mkdir(path.dirname(cfg.log), {recursive:true});
  const log = cfg.log ? fs.createWriteStream(cfg.log, {flags:'a'}) : null;
  const writeLog = row => log?.write(JSON.stringify(row) + '\n');
  const stamp = () => Math.round((performance.now() - start) * 10) / 10;
  async function mirror(url) {
    const identity = url.href;
    const hash = crypto.createHash('sha256').update(identity).digest('hex');
    const data = path.join(cfg.mirrorDir, hash.slice(0,2), hash + path.extname(url.pathname));
    const sidecar = data + '.json';
    if (fs.existsSync(data) && fs.existsSync(sidecar)) return {file:data, headers:JSON.parse(await fsp.readFile(sidecar)), mirror:'hit'};
    if (cfg.offline) { const e = new Error(`offline mirror miss: ${identity}`); e.status = 504; throw e; }
    if (pending.has(identity)) { await pending.get(identity); return {file:data, headers:JSON.parse(await fsp.readFile(sidecar)), mirror:'hit'}; }
    const task = (async () => {
      await fsp.mkdir(path.dirname(data), {recursive:true});
      const tmp = data + `.${process.pid}.${crypto.randomUUID()}.tmp`;
      try {
        const headers = await upstreamGet(url, tmp);
        await fsp.rename(tmp, data);
        await fsp.writeFile(sidecar + '.tmp', JSON.stringify(headers));
        await fsp.rename(sidecar + '.tmp', sidecar);
      } finally { await fsp.rm(tmp, {force:true}); }
    })();
    pending.set(identity, task);
    try { await task; } finally { pending.delete(identity); }
    return {file:data, headers:JSON.parse(await fsp.readFile(sidecar)), mirror:'miss'};
  }
  const server = http2.createSecureServer({allowHTTP1:true, key:await fsp.readFile(key), cert:await fsp.readFile(cert)});
  server.on('request', async (req, res) => {
    const arrived = performance.now(), t0 = stamp(), requestUrl = new URL(req.url, 'https://localhost');
    const pathname = requestUrl.pathname, query = requestUrl.search.slice(1);
    const range = req.headers.range || null, profile = cfg.profile;
    const row = {t0, ttfbMs:null, durMs:null, method:req.method, path:pathname, query,
      range, status:500, bytes:0, complete:false, encoding:null, mirror:null,
      streamId:req.stream?.id ?? null, connId:req.socket?.remotePort ?? null, profile};
    const sendControl = async (status, obj) => {
      const body = Buffer.from(JSON.stringify(obj));
      const delay = downlink.firstByteDelay();
      await new Promise(resolve=>setTimeout(resolve,Math.max(0,arrived+delay-performance.now())));
      res.writeHead(status, {'content-type':'application/json','content-length':body.length});
      row.ttfbMs=Math.round((performance.now()-arrived)*10)/10;
      row.status=status;
      await downlink.sendBuffer(body,res);
      row.bytes=body.length; row.complete=true;
    };
    try {
      if (req.method !== 'GET') await sendControl(405,{error:'GET only'});
      else if (pathname === '/__netlab/health') await sendControl(200, {ok:true, profile:cfg.profile, offline:cfg.offline});
      else if (pathname === '/__netlab/stats') await sendControl(200, {...stats, queuedBytes:downlink.queuedBytes, profile:cfg.profile, nowMs:stamp()});
      else if (pathname === '/__netlab/profile') {
        const name = requestUrl.searchParams.get('name');
        if (!PROFILES[name]) await sendControl(400, {error:'unknown profile'});
        else { cfg.profile=name; downlink.profile=PROFILES[name]; await sendControl(200, {profile:name}); }
      } else if (pathname === '/__netlab/mark') {
        writeLog({mark:requestUrl.searchParams.get('name'), t:stamp()}); await sendControl(200,{ok:true});
      } else {
        stats.requests++; stats.active++; stats.lastRequestMs=t0;
        let resource;
        for (const [prefix, dir] of cfg.static) if (pathname.startsWith(prefix)) {
          const relative = decodeURIComponent(pathname.slice(prefix.length));
          if (relative.split('/').includes('..')) { const e=new Error('bad path'); e.status=403; throw e; }
          let file=path.join(dir,relative);
          if (pathname.endsWith('/')) file=path.join(file,'index.html');
          const headers=staticHeaders(file);
          if (!range && /\bbr\b/.test(req.headers['accept-encoding'] || '') && fs.existsSync(file+'.br')) {
            file += '.br'; headers['content-encoding']='br';
          }
          resource={file,headers,mirror:'static'}; break;
        }
        if (!resource) for (const [prefix, base] of cfg.proxy) if (pathname.startsWith(prefix)) {
          const upstream=new URL(pathname.slice(prefix.length)+requestUrl.search,base);
          resource=await mirror(upstream); break;
        }
        if (!resource) { const e=new Error('not found'); e.status=404; throw e; }
        row.mirror=resource.mirror;
        const size=(await fsp.stat(resource.file)).size;
        // S3 ignores Range for encoded bodies. Mirror replay follows the same 200-full rule.
        const parsed=resource.headers['content-encoding'] ? null : parseRange(range,size);
        if (parsed===false) {
          const delay=downlink.firstByteDelay();
          await new Promise(resolve=>setTimeout(resolve,Math.max(0,arrived+delay-performance.now())));
          res.writeHead(416, {'content-range':`bytes */${size}`,'accept-ranges':'bytes'});
          res.end(); row.status=416; row.ttfbMs=Math.round((performance.now()-arrived)*10)/10;
        } else {
          const from=parsed?.start ?? 0, to=parsed?.end ?? size-1;
          const bytes=to-from+1;
          const headers={...resource.headers,'accept-ranges':'bytes','content-length':bytes};
          if (parsed) headers['content-range']=`bytes ${from}-${to}/${size}`;
          const delay=downlink.firstByteDelay();
          await new Promise(resolve=>setTimeout(resolve,Math.max(0,arrived+delay-performance.now())));
          res.writeHead(parsed?206:200,headers); row.ttfbMs=Math.round((performance.now()-arrived)*10)/10;
          row.status=parsed?206:200; row.encoding=headers['content-encoding']||null;
          await downlink.send(resource.file,from,bytes,res);
          row.bytes=bytes; row.complete=true; stats.bytes+=bytes;
          if (resource.mirror==='hit') stats.hits++; if (resource.mirror==='miss') stats.misses++;
        }
      }
    } catch (error) {
      stats.errors++; row.bytes=error.sent||0; stats.bytes+=row.bytes;
      if (!res.headersSent) { row.status=error.status||500; await sendControl(row.status,{error:error.message}); }
      else if (!res.destroyed) res.destroy(error);
    } finally {
      if (req.method === 'GET' && !pathname.startsWith('/__netlab/')) stats.active--;
      row.durMs=Math.round((performance.now()-arrived)*10)/10;
      if (row.ttfbMs===null) row.ttfbMs=row.durMs;
      writeLog(row);
    }
  });
  await new Promise(resolve=>server.listen(cfg.port,cfg.host,resolve));
  console.log(`netlab https://${cfg.host}:${cfg.port} ${cfg.profile} offline=${cfg.offline}`);
  return {server, downlink, stats};
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname))
  startServer(args(process.argv.slice(2))).catch(e => {console.error(e);process.exitCode=1;});
