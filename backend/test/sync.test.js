import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Store, SyncService, rangeFor } from '../dist/sync.js';
const activity = (id, name = 'run') => ({ activityId: id, activityName: name, startTimeLocal: '2026-01-01 10:00:00', distance: 1000, averageHR: 120, maxHR: 150, movingDuration: 300, duration: 310, averageSpeed: 3, aerobicTrainingEffect: 2, minTemperature: 0, maxTemperature: 10, activityType: { typeKey: 'running' } });
test('inclusive range defaults and validation', () => {
  assert.deepEqual(rangeFor(undefined, undefined, new Date('2026-01-01T23:00Z')), {start:'2025-01-02',end:'2026-01-01'});
  assert.deepEqual(rangeFor('2025-01-02','2026-01-01'), {start:'2025-01-02',end:'2026-01-01'});
  for (const pair of [['2025-01-01','2026-01-01'],['2026-02-30','2026-03-01'],['2026-02-01','2026-01-01']]) assert.throws(() => rangeFor(...pair));
});
test('pagination, upsert, failure retention, retry and status', async () => {
  const store = new Store(':memory:');
  let version = 0; let offsets = [];
  const client = { async page(range, offset) { offsets.push(offset); if (version === 2) throw Error('network'); return offset === 0 ? Array.from({length:100}, (_, i) => activity(i+1, version ? 'updated' : 'run')) : [activity(101)]; } };
  const sync = new SyncService(store, client);
  assert.equal(store.db.prepare('PRAGMA user_version').get().user_version, 1);
  await sync.sync(); assert.deepEqual(offsets, [0,100]);
  version = 1; offsets = []; await sync.sync();
  assert.equal(store.db.prepare('SELECT COUNT(*) n FROM activities').get().n, 101);
  assert.equal(JSON.parse(store.db.prepare('SELECT data FROM activities WHERE id=?').get('1').data).activityName, 'updated');
  version = 2; await assert.rejects(sync.sync(), /network/); assert.equal(sync.status().state, 'failed');
  assert.equal(store.db.prepare('SELECT COUNT(*) n FROM activities').get().n, 101);
  version = 1; await sync.sync(); assert.equal(sync.status().state, 'success');
  assert.equal(store.db.prepare('SELECT COUNT(*) n FROM activities').get().n, 101);
  store.close();
});
test('overlap rejected and missing fields retain data', async () => {
  const store = new Store(':memory:'); let release;
  const sync = new SyncService(store, {page: () => new Promise(resolve => { release = resolve; })});
  const pending = sync.sync(); assert.equal(sync.status().state, 'running');
  await assert.rejects(sync.sync(), /already running/); release([activity(1)]); await pending;
  const invalid = new SyncService(store, {page: async () => [{...activity(2), maxTemperature: null}]});
  await assert.rejects(invalid.sync(), /missing required/); assert.equal(store.db.prepare('SELECT COUNT(*) n FROM activities').get().n, 1);
  store.close();
});
