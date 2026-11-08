import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from '../dist/sync.js';
test('server remains available when startup sync fails and accepts retry', async () => {
  const dbPath = join(mkdtempSync(join(tmpdir(), 'garmin-db-')), 'test.sqlite');
  const store = new Store(dbPath);
  store.db.prepare('INSERT INTO activities (id, data) VALUES (?, ?)').run('1', JSON.stringify({ activityType: { typeKey: 'running' }, activityName: 'Monday', startTimeLocal: '2026-01-01 06:00:00', maxHR: 160, aerobicTrainingEffect: 3, distance: 10000, averageHR: 140, movingDuration: 3600, duration: 3660, averageSpeed: 2.5, minTemperature: 20, maxTemperature: 24 }));
  store.close();
  const child = spawn(process.execPath, [fileURLToPath(new URL('../dist/index.js', import.meta.url))], { cwd: mkdtempSync(join(tmpdir(), 'garmin-test-')), env: { ...process.env, PORT:'30987', SQLITE_PATH:dbPath, GARMIN_PERSONAL_API_KEY:'' }, stdio: 'ignore' });
  try {
    let response;
    for (let i = 0; i < 100; i++) { try { response = await fetch('http://127.0.0.1:30987/sync/status'); break; } catch { await new Promise(resolve => setTimeout(resolve, 20)); } }
    const saved = await (await fetch('http://127.0.0.1:30987/workouts')).json();
    assert.equal(saved[0].Title, 'Monday');
    assert.equal(saved[0]['Progression #'], '1');
    const fixture = new Store(dbPath);
    fixture.db.exec('CREATE TABLE activity_classifications (activity_id TEXT, workout_type TEXT, progression INTEGER, reviewed_row_json TEXT)');
    fixture.db.prepare('INSERT INTO activity_classifications VALUES (?, ?, ?, ?)').run('1', 'race', 1, '{\"secret\":\"private-token\"}');
    fixture.close();
    const invalid = await fetch('http://127.0.0.1:30987/workouts');
    assert.equal(invalid.status, 500);
    assert.ok(!(await invalid.text()).includes('private-token'));
    assert.ok(response); assert.equal((await response.json()).state, 'failed');
    assert.equal((await fetch('http://127.0.0.1:30987/sync', {method:'POST'})).status, 202);
    assert.equal((await (await fetch('http://127.0.0.1:30987/sync/status')).json()).state, 'failed');
  } finally { child.kill(); }
});
