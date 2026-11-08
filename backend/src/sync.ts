import { DatabaseSync } from 'node:sqlite';

export type Range = { start: string; end: string };
export type Activity = Record<string, unknown>;
export interface Client { page(range: Range, offset: number, limit: number): Promise<Activity[]> }
const day = 86400000;
function parseDate(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Dates must be YYYY-MM-DD');
  const date = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== value) throw new Error('Invalid calendar date');
  return date;
}
export function rangeFor(start?: string, end?: string, now = new Date()): Range {
  const last = end ?? now.toISOString().slice(0, 10);
  const endMs = parseDate(last);
  const first = start ?? new Date(endMs - 364 * day).toISOString().slice(0, 10);
  const startMs = parseDate(first);
  if (startMs > endMs || endMs - startMs >= 365 * day) throw new Error('Range must contain 1 to 365 inclusive dates');
  return { start: first, end: last };
}
export class Store {
  readonly db: DatabaseSync;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    const version = Number((this.db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version);
    if (version > 1) throw new Error('Unsupported database version');
    if (version === 0) this.db.exec(`BEGIN; CREATE TABLE activities (id TEXT PRIMARY KEY, data TEXT NOT NULL); CREATE TABLE sync_status (id INTEGER PRIMARY KEY CHECK (id = 1), state TEXT NOT NULL, started_at TEXT, finished_at TEXT, error TEXT); INSERT INTO sync_status (id, state) VALUES (1, 'idle'); PRAGMA user_version = 1; COMMIT;`);
    this.db.prepare("UPDATE sync_status SET state='failed', finished_at=?, error='Interrupted before completion' WHERE state='running'").run(new Date().toISOString());
  }
  status() { return this.db.prepare('SELECT state, started_at, finished_at, error FROM sync_status WHERE id=1').get(); }
  close() { this.db.close(); }
}
const required = ['activityName', 'startTimeLocal', 'distance', 'averageHR', 'maxHR', 'movingDuration', 'duration', 'averageSpeed', 'aerobicTrainingEffect', 'minTemperature', 'maxTemperature', 'activityType'];
function validate(activity: Activity): string {
  const id = activity.activityId;
  if (!((typeof id === 'number' && Number.isSafeInteger(id) && id > 0) || (typeof id === 'string' && /^[1-9]\d*$/.test(id)))) throw new Error('Activity has an invalid ID');
  if (required.some(key => activity[key] == null)) throw new Error('Activity is missing required dashboard fields');
  for (const key of required.slice(2, 11)) if (typeof activity[key] !== 'number' || !Number.isFinite(activity[key])) throw new Error('Activity has invalid dashboard metrics');
  if (typeof activity.activityName !== 'string' || !activity.activityName.trim() || typeof activity.startTimeLocal !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(activity.startTimeLocal)) throw new Error('Activity has invalid title or date');
  for (const key of ['distance','averageHR','maxHR','movingDuration','duration','averageSpeed']) if ((activity[key] as number) <= 0) throw new Error('Activity has invalid dashboard metrics');
  return String(id);
}
export class SyncService {
  private running = false;
  constructor(private store: Store, private client: Client) {}
  status() { return this.store.status(); }
  async sync(start?: string, end?: string): Promise<void> {
    if (this.running) throw new Error('Sync already running');
    this.running = true;
    const db = this.store.db;
    try {
      const range = rangeFor(start, end);
      db.prepare("UPDATE sync_status SET state='running', started_at=?, finished_at=NULL, error=NULL WHERE id=1").run(new Date().toISOString());
      const items = new Map<string, Activity>();
      const limit = 100;
      for (let offset = 0; ; offset += limit) {
        const page = await this.client.page(range, offset, limit);
        if (!Array.isArray(page) || page.length > limit) throw new Error('Invalid activity page');
        for (const activity of page) { const id = validate(activity); if (items.has(id)) throw new Error('Duplicate activity ID in response'); items.set(id, activity); }
        if (page.length < limit) break;
      }
      db.exec('BEGIN');
      try {
        const insert = db.prepare('INSERT INTO activities (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data');
        for (const [id, activity] of items) insert.run(id, JSON.stringify(activity));
        db.prepare("UPDATE sync_status SET state='success', finished_at=?, error=NULL WHERE id=1").run(new Date().toISOString());
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    } catch (error) {
      db.prepare("UPDATE sync_status SET state='failed', finished_at=?, error=? WHERE id=1").run(new Date().toISOString(), error instanceof Error ? error.message : 'Sync failed');
      throw error;
    } finally { this.running = false; }
  }
}
