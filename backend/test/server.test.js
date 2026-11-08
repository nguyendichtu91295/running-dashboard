import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
test('server remains available when startup sync fails and accepts retry', async () => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../dist/index.js', import.meta.url))], { cwd: mkdtempSync(join(tmpdir(), 'garmin-test-')), env: { ...process.env, PORT:'30987', SQLITE_PATH:':memory:', GARMIN_PERSONAL_API_KEY:'' }, stdio: 'ignore' });
  try {
    let response;
    for (let i = 0; i < 100; i++) { try { response = await fetch('http://127.0.0.1:30987/sync/status'); break; } catch { await new Promise(resolve => setTimeout(resolve, 20)); } }
    assert.ok(response); assert.equal((await response.json()).state, 'failed');
    assert.equal((await fetch('http://127.0.0.1:30987/sync', {method:'POST'})).status, 202);
    assert.equal((await (await fetch('http://127.0.0.1:30987/sync/status')).json()).state, 'failed');
  } finally { child.kill(); }
});
