import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readWorkouts } from '../dist/workouts.js';
const raw = (date = '2026-01-01 06:00:00') => ({ activityName:'Monday race', startTimeLocal:date, activityType:{typeKey:'running'}, maxHR:160, aerobicTrainingEffect:3, distance:10000, averageHR:140, movingDuration:3600, duration:3660, averageSpeed:2.5, minTemperature:20, maxTemperature:24 });
const fields = ['Activity Type','Aerobic TE','Avg HR','Avg Pace','Date','Distance','Max HR','Max Temp','Min Temp','Moving Time','Progression #','Time','Title','Workout Group','Workout Type'];
const db = () => { const d = new DatabaseSync(':memory:'); d.exec('CREATE TABLE activities (id TEXT PRIMARY KEY, data TEXT NOT NULL)'); return d; };
const add = (d,id,a=raw()) => d.prepare('INSERT INTO activities VALUES (?,?)').run(id,JSON.stringify(a));
const classifications = d => d.exec('CREATE TABLE activity_classifications (activity_id TEXT PRIMARY KEY, workout_type TEXT, progression INTEGER, reviewed_row_json TEXT)');
const snapshot = () => Object.fromEntries(fields.map(k => [k, 'saved']));
test('empty and absent classifications project raw data deterministically', () => {
  const d=db(); assert.deepEqual(readWorkouts(d), []); add(d,'2'); add(d,'1');
  const rows=readWorkouts(d); assert.deepEqual(rows.map(r=>r['Progression #']),['2','1']);
  assert.equal(rows[0]['Workout Type'],'uncategorized'); assert.equal(rows[0]['Activity Type'],'running'); assert.equal(rows[0].Distance,'10'); assert.equal(rows[0]['Avg Pace'],'6:40'); assert.equal(rows[0]['Moving Time'],'1:00:00');
  assert.deepEqual(Object.keys(rows[0]).sort(),fields.sort()); assert.ok(Object.values(rows[0]).every(v=>typeof v==='string'));
  d.exec('DELETE FROM activities'); add(d,'1'); add(d,'2'); assert.deepEqual(readWorkouts(d).map(r=>r['Progression #']),['1','2']); d.close();
});
test('reviewed snapshot is whitelisted and fallback follows maximum saved progression', () => {
  const d=db(); classifications(d); add(d,'1'); add(d,'2'); const s={...snapshot(),Secret:'private'};
  d.prepare('INSERT INTO activity_classifications VALUES (?,?,?,?)').run('1','uncategorized',7,JSON.stringify(s));
  const rows=readWorkouts(d); assert.equal(rows[0]['Progression #'],'7'); assert.equal(rows[0]['Workout Type'],'uncategorized'); assert.equal(rows[0].Title,'saved'); assert.equal(rows[0].Secret,undefined); assert.equal(rows[1]['Progression #'],'8'); d.close();
});
test('invalid reviewed and raw metrics fail explicitly', () => {
  const d=db(); classifications(d); add(d,'1'); d.prepare('INSERT INTO activity_classifications VALUES (?,?,?,?)').run('1','race',1,'{"secret":"private"}'); assert.throws(()=>readWorkouts(d));
  d.exec('DELETE FROM activity_classifications'); d.prepare('UPDATE activities SET data=?').run(JSON.stringify({...raw(),averageSpeed:null})); assert.throws(()=>readWorkouts(d)); d.close();
});
