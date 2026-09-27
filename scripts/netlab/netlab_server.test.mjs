import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {Downlink, parseRange} from './netlab_server.mjs';

function fixture(bytes) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'netlab-test-'));
  const file=path.join(dir,'body'); fs.writeFileSync(file,Buffer.alloc(bytes,7));
  return {file,cleanup:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
async function transfer(link,file,size) {
  const out=new PassThrough(); let received=0;
  out.on('data',b=>received+=b.length);
  const start=performance.now(); await link.send(file,0,size,out);
  return {ms:performance.now()-start,received};
}
test('single 1 MB body obeys 8 Mbit/s within 5%',async()=>{
  const f=fixture(1_000_000);
  try { const x=await transfer(new Downlink({bandwidthBps:1_000_000,rttMs:0,bloatMs:0}),f.file,1_000_000);
    assert.equal(x.received,1_000_000); assert.ok(x.ms>950&&x.ms<1050,`elapsed ${x.ms}`); }
  finally {f.cleanup();}
});
test('concurrent bodies share one bottleneck',async()=>{
  const f=fixture(1_000_000);
  try { const link=new Downlink({bandwidthBps:1_000_000,rttMs:0,bloatMs:0});
    const [a,b]=await Promise.all([transfer(link,f.file,1_000_000),transfer(link,f.file,1_000_000)]);
    assert.ok(a.ms>1900&&a.ms<2100,`A ${a.ms}`);
    assert.ok(b.ms>1900&&b.ms<2100,`B ${b.ms}`); }
  finally {f.cleanup();}
});
test('busy queue inflates a new first byte',async()=>{
  const f=fixture(1_000_000);
  try {const link=new Downlink({bandwidthBps:1_000_000,rttMs:90,bloatMs:450});
    const big=transfer(link,f.file,1_000_000);
    assert.ok(link.firstByteDelay()>530&&link.firstByteDelay()<=540);
    await big; assert.equal(link.firstByteDelay(),90);}
  finally {f.cleanup();}
});
test('control body uses the same scheduler',async()=>{
  const link=new Downlink({bandwidthBps:1000,rttMs:0,bloatMs:0});
  const out=new PassThrough(); let received=0; out.on('data',b=>received+=b.length);
  const started=performance.now(); await link.sendBuffer(Buffer.alloc(1000),out);
  assert.equal(received,1000); assert.ok(performance.now()-started>900);
});
test('single byte ranges and invalid ranges',()=>{
  assert.deepEqual(parseRange('bytes=2-4',10),{start:2,end:4});
  assert.deepEqual(parseRange('bytes=4-',10),{start:4,end:9});
  assert.deepEqual(parseRange('bytes=-3',10),{start:7,end:9});
  assert.equal(parseRange('bytes=10-',10),false);
  assert.equal(parseRange('bytes=1-2,4-5',10),false);
});
