import type { DatabaseSync } from 'node:sqlite';
const fields = ['Activity Type', 'Aerobic TE', 'Avg HR', 'Avg Pace', 'Date', 'Distance', 'Max HR', 'Max Temp', 'Min Temp', 'Moving Time', 'Progression #', 'Time', 'Title', 'Workout Group', 'Workout Type'] as const;
type Row = { id: string; data: string; reviewed_row_json: string | null; workout_type: string | null; progression: number | null };
const duration = (seconds: number) => { const n = Math.round(seconds); return `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`; };
const pace = (seconds: number) => { const n = Math.round(seconds); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
function object(json: string): Record<string, unknown> { const value: unknown = JSON.parse(json); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid workout data'); return value as Record<string, unknown>; }
function text(value: unknown): string { if (typeof value !== 'string' || !value.trim()) throw new Error('Missing required workout field'); return value; }
function metric(a: Record<string, unknown>, key: string, positive = false): number { const value = a[key]; if (typeof value !== 'number' || !Number.isFinite(value) || (positive && value <= 0)) throw new Error('Invalid workout metric'); return value; }
export function readWorkouts(db: DatabaseSync): Record<string, string>[] {
  const exists = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='activity_classifications'").get();
  const rows = db.prepare(exists ? 'SELECT a.id, a.data, c.reviewed_row_json, c.workout_type, c.progression FROM activities a LEFT JOIN activity_classifications c ON c.activity_id = a.id' : 'SELECT id, data, NULL AS reviewed_row_json, NULL AS workout_type, NULL AS progression FROM activities').all() as Row[];
  let max = 0;
  const result: { id: string; reviewed: boolean; row: Record<string, string> }[] = rows.map(r => {
    if (r.reviewed_row_json !== null || r.workout_type !== null || r.progression !== null) {
      const snapshot = object(text(r.reviewed_row_json)); const type = text(r.workout_type);
      if (!Number.isSafeInteger(r.progression) || (r.progression as number) <= 0) throw new Error('Invalid workout progression');
      const projected: Record<string, string> = {};
      for (const field of fields) projected[field] = field === 'Workout Type' ? type : field === 'Progression #' ? String(r.progression) : text(snapshot[field]);
      if (type === 'uncategorized') max = Math.max(max, r.progression as number);
      return { id: r.id, reviewed: true, row: projected };
    }
    const a = object(r.data);
    const activityType = typeof a.activityType === 'object' && a.activityType !== null ? (a.activityType as Record<string, unknown>).typeKey : a.activityType;
    const date = text(a.startTimeLocal).replace('T', ' ').slice(0, 19);
    if (!/^\d{4}-\d{2}-\d{2}/.test(date)) throw new Error('Invalid workout date');
    return { id: r.id, reviewed: false, row: { 'Activity Type': text(activityType), 'Aerobic TE': String(metric(a, 'aerobicTrainingEffect')), 'Avg HR': String(metric(a, 'averageHR', true)), 'Avg Pace': pace(1000 / metric(a, 'averageSpeed', true)), Date: date, Distance: String(metric(a, 'distance', true) / 1000), 'Max HR': String(metric(a, 'maxHR', true)), 'Max Temp': String(metric(a, 'maxTemperature')), 'Min Temp': String(metric(a, 'minTemperature')), 'Moving Time': duration(metric(a, 'movingDuration', true)), 'Progression #': '', Time: duration(metric(a, 'duration', true)), Title: text(a.activityName), 'Workout Group': 'Uncategorized', 'Workout Type': 'uncategorized' } };
  });
  const unreviewed = result.filter(r => !r.reviewed).sort((a, b) => a.row.Date.localeCompare(b.row.Date) || a.id.localeCompare(b.id));
  for (const item of unreviewed) item.row['Progression #'] = String(++max);
  return result.map(item => item.row);
}
